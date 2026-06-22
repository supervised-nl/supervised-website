"use server";

import { revalidatePath } from "next/cache";

import { anthropic } from "@/lib/anthropic";
import { requireRole } from "@/lib/auth";
import { getResend } from "@/lib/resend";
import { createServiceClient } from "@/lib/supabase/service";

function buildChallengePrompt(args: {
  organizationName: string;
  sector: string | null;
  weekNumber: number;
  processes: string | null;
  toolsUsed: string | null;
  useCases: string | null;
  notes: string | null;
  previousChallengeTitles: string[];
}) {
  const previousBlock =
    args.previousChallengeTitles.length > 0
      ? `\nEerder gegeven uitdagingen (vermijd herhaling, bouw voort op wat al geleerd is):\n${args.previousChallengeTitles.map((t) => `- ${t}`).join("\n")}\n`
      : "";

  return `Je schrijft een wekelijkse micro-uitdaging voor het team van een Nederlands MKB-bedrijf dat een AI-workshop heeft gevolgd. Doel: de kennis uit de workshop praktisch laten landen in hun werk.

Bedrijf: ${args.organizationName}${args.sector ? ` (sector: ${args.sector})` : ""}
Weeknummer: ${args.weekNumber}

Workshopcontext:
- Processen: ${args.processes ?? "onbekend"}
- Gebruikte tools: ${args.toolsUsed ?? "onbekend"}
- Use cases: ${args.useCases ?? "onbekend"}
- Notities: ${args.notes ?? "geen"}
${previousBlock}
Schrijf een korte, concrete uitdaging die een medewerker in maximaal een uur kan uitvoeren met AI, aansluitend op de workshopcontext. Direct, geen jargon, "je/jouw" aanspreekvorm.

Antwoord uitsluitend met geldige JSON in dit exacte formaat, zonder uitleg ervoor of erna:
{"title": "...", "description": "...", "expected_outcome": "..."}`;
}

function parseChallengeJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("De uitdaging kon niet gegenereerd worden. Probeer het opnieuw.");
  }

  const parsed = JSON.parse(match[0]) as Partial<{
    title: string;
    description: string;
    expected_outcome: string;
  }>;

  if (!parsed.title || !parsed.description) {
    throw new Error("De uitdaging kon niet gegenereerd worden. Probeer het opnieuw.");
  }

  return {
    title: parsed.title,
    description: parsed.description,
    expected_outcome: parsed.expected_outcome ?? null,
  };
}

export async function generateChallenge(orgId: string) {
  await requireRole(["super_admin"]);
  const supabase = createServiceClient();

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("name, sector")
    .eq("id", orgId)
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Organisatie niet gevonden.");
  }

  const { data: context } = await supabase
    .from("workshop_contexts")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: existingChallenges } = await supabase
    .from("challenges")
    .select("week_number, title")
    .eq("organization_id", orgId)
    .order("week_number", { ascending: false })
    .limit(10);

  const weekNumber = (existingChallenges?.[0]?.week_number ?? 0) + 1;
  const previousChallengeTitles = (existingChallenges ?? []).map((c) => c.title).reverse();

  let generated: { title: string; description: string; expected_outcome: string | null };

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: buildChallengePrompt({
            organizationName: org.name,
            sector: org.sector,
            weekNumber,
            processes: context?.processes ?? null,
            toolsUsed: context?.tools_used ?? null,
            useCases: context?.use_cases ?? null,
            notes: context?.notes ?? null,
            previousChallengeTitles,
          }),
        },
      ],
    });

    const block = response.content[0];
    if (block.type !== "text") {
      throw new Error("De uitdaging kon niet gegenereerd worden. Probeer het opnieuw.");
    }

    generated = parseChallengeJson(block.text);
  } catch {
    throw new Error("Uitdaging genereren mislukt. Probeer het over een moment opnieuw.");
  }

  const { error: insertError } = await supabase.from("challenges").insert({
    organization_id: orgId,
    workshop_context_id: context?.id ?? null,
    week_number: weekNumber,
    title: generated.title,
    description: generated.description,
    expected_outcome: generated.expected_outcome,
    status: "draft",
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath(`/admin/challenges/${orgId}`);
}

export async function updateChallenge(challengeId: string, formData: FormData) {
  await requireRole(["super_admin"]);

  const title = formData.get("title");
  const description = formData.get("description");
  const expectedOutcome = formData.get("expectedOutcome");

  if (typeof title !== "string" || !title.trim() || typeof description !== "string" || !description.trim()) {
    throw new Error("Titel en beschrijving zijn verplicht.");
  }

  const supabase = createServiceClient();
  const { data: updated, error } = await supabase
    .from("challenges")
    .update({
      title: title.trim(),
      description: description.trim(),
      expected_outcome:
        typeof expectedOutcome === "string" && expectedOutcome.trim()
          ? expectedOutcome.trim()
          : null,
    })
    .eq("id", challengeId)
    .select("organization_id")
    .single();

  if (error || !updated) {
    throw new Error("Je wijzigingen zijn niet opgeslagen. Controleer je invoer en probeer opnieuw.");
  }

  revalidatePath(`/admin/challenges/${updated.organization_id}`);
}

function computeNextSendAt(sendDay: number, sendTime: string): Date {
  const [hours, minutes] = sendTime.split(":").map(Number);
  const now = new Date();
  const target = new Date(now);

  const currentDay = target.getDay();
  let daysUntil = (sendDay - currentDay + 7) % 7;

  if (daysUntil === 0) {
    target.setHours(hours, minutes, 0, 0);
    if (target > now) return target;
    daysUntil = 7;
  }

  target.setDate(target.getDate() + daysUntil);
  target.setHours(hours, minutes, 0, 0);
  return target;
}

export async function activateChallenge(challengeId: string) {
  await requireRole(["super_admin"]);
  const supabase = createServiceClient();

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, organization_id, title, description")
    .eq("id", challengeId)
    .single();

  if (challengeError || !challenge) {
    throw new Error("Deze uitdaging bestaat niet meer. Ga terug en probeer een ander.");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("challenge_send_day, challenge_send_time")
    .eq("id", challenge.organization_id)
    .single();

  const sendDay = org?.challenge_send_day;
  const sendTime = org?.challenge_send_time ?? "10:00";

  const sendAt = sendDay != null ? computeNextSendAt(sendDay, sendTime) : new Date();
  const sendNow = sendAt <= new Date();

  const { error: completePreviousError } = await supabase
    .from("challenges")
    .update({ status: "completed" })
    .eq("organization_id", challenge.organization_id)
    .eq("status", "active")
    .neq("id", challengeId);

  if (completePreviousError) {
    throw new Error(completePreviousError.message);
  }

  const { error: activateError } = await supabase
    .from("challenges")
    .update({ status: "active", send_at: sendAt.toISOString(), emails_sent: sendNow })
    .eq("id", challengeId);

  if (activateError) {
    throw new Error(activateError.message);
  }

  if (sendNow) {
    const { data: members, error: membersError } = await supabase
      .from("users")
      .select("email, name")
      .eq("organization_id", challenge.organization_id)
      .eq("role", "member");

    if (membersError) {
      throw new Error(membersError.message);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coach.supervised.nl";
    for (const member of (members ?? [])) {
      if (!member.email) continue;
      try {
        await getResend().emails.send({
          from: "Supervised Coach <coach@supervised.nl>",
          to: member.email,
          subject: `Nieuwe uitdaging: ${challenge.title}`,
          text: `Hoi${member.name ? ` ${member.name.split(" ")[0]}` : ""},\n\nEr staat een nieuwe uitdaging voor je klaar.\n\n${challenge.title}\n\n${challenge.description}\n\nGa naar ${appUrl}/dashboard/member om aan de slag te gaan.\n\nGroeten,\nSupervised Coach`,
        });
      } catch {
        throw new Error("E-mail kon niet verzonden worden. Controleer of het e-mailadres klopt.");
      }
    }
  }

  revalidatePath(`/admin/challenges/${challenge.organization_id}`);
}

export async function sendChallengeMail(challengeId: string, _formData: FormData) {
  await requireRole(["super_admin"]);
  const supabase = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coach.supervised.nl";

  const { data: challenge, error } = await supabase
    .from("challenges")
    .select("id, organization_id, title, description")
    .eq("id", challengeId)
    .eq("status", "active")
    .single();

  if (error || !challenge) throw new Error("Alleen actieve uitdagingen kunnen worden verstuurd.");

  const { data: members } = await supabase
    .from("users")
    .select("email, name")
    .eq("organization_id", challenge.organization_id)
    .eq("role", "member");

  for (const member of members ?? []) {
    if (!member.email) continue;
    await getResend().emails.send({
      from: "Supervised Coach <coach@supervised.nl>",
      to: member.email,
      subject: `Nieuwe uitdaging: ${challenge.title}`,
      text: `Hoi${member.name ? ` ${member.name.split(" ")[0]}` : ""},\n\nEr staat een nieuwe uitdaging voor je klaar.\n\n${challenge.title}\n\n${challenge.description}\n\nGa naar ${appUrl}/dashboard/member om aan de slag te gaan.\n\nGroeten,\nSupervised Coach`,
    });
  }

  await supabase.from("challenges").update({ emails_sent: true }).eq("id", challengeId);
  revalidatePath(`/admin/challenges/${challenge.organization_id}`);
}

export async function deleteChallenge(challengeId: string) {
  await requireRole(["super_admin"]);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", challengeId)
    .eq("status", "draft")
    .select("organization_id")
    .single();

  if (error || !data) {
    throw new Error("Uitdaging kon niet worden verwijderd. Alleen concepten kunnen worden verwijderd.");
  }

  revalidatePath(`/admin/challenges/${data.organization_id}`);
}
