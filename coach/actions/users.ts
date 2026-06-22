"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { UserRole } from "@/lib/types";

export async function createUser(formData: FormData) {
  await requireRole(["super_admin"]);

  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const role = formData.get("role");
  const organizationId = formData.get("organizationId");

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password ||
    (role !== "admin" && role !== "member") ||
    typeof organizationId !== "string" ||
    !organizationId
  ) {
    throw new Error("Vul alle velden in.");
  }

  const supabase = createServiceClient();
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Gebruiker aanmaken is mislukt.");
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: created.user.id,
    organization_id: organizationId,
    role: role as UserRole,
    name: name.trim(),
    email: email.trim(),
  });

  if (insertError) {
    await supabase.auth.admin.deleteUser(created.user.id);
    throw new Error(insertError.message);
  }

  redirect(`/admin/organizations/${organizationId}`);
}

export async function updateUser(userId: string, formData: FormData) {
  await requireRole(["super_admin"]);

  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const role = formData.get("role");
  const organizationId = formData.get("organizationId");

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    (role !== "admin" && role !== "member") ||
    typeof organizationId !== "string" ||
    !organizationId
  ) {
    throw new Error("Vul alle velden in.");
  }

  if (typeof password === "string" && password.length > 0 && password.length < 8) {
    throw new Error("Wachtwoord moet minimaal 8 tekens zijn.");
  }

  const supabase = createServiceClient();

  const { error: updateError } = await supabase
    .from("users")
    .update({
      organization_id: organizationId,
      role: role as UserRole,
      name: name.trim(),
      email: email.trim(),
    })
    .eq("id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const authUpdate: { email?: string; password?: string } = { email: email.trim() };
  if (typeof password === "string" && password.length > 0) {
    authUpdate.password = password;
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(userId, authUpdate);

  if (authError) {
    throw new Error(authError.message);
  }

  revalidatePath(`/admin/organizations/${organizationId}`);
  redirect(`/admin/organizations/${organizationId}`);
}

export async function inviteUser(orgId: string, formData: FormData) {
  await requireRole(["super_admin"]);

  const name = formData.get("name");
  const email = formData.get("email");
  const role = formData.get("role");

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    (role !== "admin" && role !== "member")
  ) {
    throw new Error("Vul naam, e-mailadres en rol in.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coach.supervised.nl";
  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: email.trim(),
    email_confirm: true,
  });

  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Gebruiker aanmaken is mislukt.");
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: created.user.id,
    organization_id: orgId,
    role: role as UserRole,
    name: name.trim(),
    email: email.trim(),
  });

  if (insertError) {
    await supabase.auth.admin.deleteUser(created.user.id);
    throw new Error(insertError.message);
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: email.trim(),
  });

  if (linkError || !linkData.properties?.hashed_token) {
    throw new Error("Uitnodigingslink kon niet worden aangemaakt.");
  }

  // Eigen confirm-route met token_hash i.p.v. de Supabase action_link: die werkt
  // server-side zonder PKCE-verifier, dus ook in de browser van de genodigde.
  const confirmUrl = `${appUrl}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/reset-password`;

  const { getResend } = await import("@/lib/resend");
  try {
    await getResend().emails.send({
      from: "Supervised Coach <coach@supervised.nl>",
      to: email.trim(),
      subject: `Je bent uitgenodigd voor Supervised Coach`,
      text: `Hoi ${name.trim()},\n\nJe bent uitgenodigd voor Supervised Coach van ${org?.name ?? "je organisatie"}.\n\nKlik op de link hieronder om je wachtwoord in te stellen en aan de slag te gaan:\n\n${confirmUrl}\n\nDe link is 24 uur geldig.\n\nGroeten,\nSupervised Coach`,
    });
  } catch {
    throw new Error("Uitnodigingsmail kon niet worden verzonden.");
  }

  revalidatePath(`/admin/organizations/${orgId}`);
}

export async function bulkInviteUsers(
  orgId: string,
  _prevState: { error: string | null; sent: number; failed: string[] } | null,
  formData: FormData,
): Promise<{ error: string | null; sent: number; failed: string[] }> {
  await requireRole(["super_admin"]);

  const raw = formData.get("emails");
  const role = formData.get("role");

  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "Voer minimaal één e-mailadres in.", sent: 0, failed: [] };
  }

  if (role !== "admin" && role !== "member") {
    return { error: "Kies een geldige rol.", sent: 0, failed: [] };
  }

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coach.supervised.nl";
  const supabase = createServiceClient();

  const { data: org } = await supabase.from("organizations").select("name").eq("id", orgId).single();

  let sent = 0;
  const failed: string[] = [];

  for (const line of lines) {
    // Accepteer "Naam <email>" of gewoon "email"
    const match = line.match(/^(?:(.+?)\s+)?<?([^\s<>]+@[^\s<>]+)>?$/);
    if (!match) {
      failed.push(line);
      continue;
    }

    const name = (match[1]?.trim() || match[2].split("@")[0]).trim();
    const email = match[2].trim().toLowerCase();

    try {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createError || !created.user) throw new Error(createError?.message);

      const { error: insertError } = await supabase.from("users").insert({
        id: created.user.id,
        organization_id: orgId,
        role: role as UserRole,
        name,
        email,
      });

      if (insertError) {
        await supabase.auth.admin.deleteUser(created.user.id);
        throw new Error(insertError.message);
      }

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
      });

      if (linkError || !linkData.properties?.hashed_token) throw new Error("Link aanmaken mislukt.");

      const confirmUrl = `${appUrl}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/reset-password`;

      const { getResend } = await import("@/lib/resend");
      await getResend().emails.send({
        from: "Supervised Coach <coach@supervised.nl>",
        to: email,
        subject: "Je bent uitgenodigd voor Supervised Coach",
        text: `Hoi ${name},\n\nJe bent uitgenodigd voor Supervised Coach van ${org?.name ?? "je organisatie"}.\n\nKlik op de link hieronder om je wachtwoord in te stellen:\n\n${confirmUrl}\n\nDe link is 24 uur geldig.\n\nGroeten,\nSupervised Coach`,
      });

      sent++;
    } catch {
      failed.push(email);
    }
  }

  revalidatePath(`/admin/organizations/${orgId}/gebruikers`);
  return { error: null, sent, failed };
}

export async function resendInvite(userId: string, orgId: string) {
  await requireRole(["super_admin"]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coach.supervised.nl";
  const supabase = createServiceClient();

  const [{ data: user, error: userError }, { data: org }] = await Promise.all([
    supabase.from("users").select("name, email").eq("id", userId).single(),
    supabase.from("organizations").select("name").eq("id", orgId).single(),
  ]);

  if (userError || !user) throw new Error("Gebruiker niet gevonden.");
  if (!user.email) throw new Error("Gebruiker heeft geen e-mailadres.");

  // Stel een willekeurig tijdelijk wachtwoord in zodat de gebruiker niet meer
  // "passwordless" is. Zonder wachtwoord werkt verifyOtp met type "recovery"
  // niet voor bestaande accounts — dit zet de account in de juiste staat.
  const { randomBytes } = await import("crypto");
  const tempPassword = randomBytes(24).toString("base64url") + "Aa1!";
  await supabase.auth.admin.updateUserById(userId, { password: tempPassword });

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: user.email,
  });

  if (linkError || !linkData.properties?.hashed_token) {
    throw new Error("Link kon niet worden aangemaakt.");
  }

  const confirmUrl = `${appUrl}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/reset-password`;

  const { getResend } = await import("@/lib/resend");
  try {
    await getResend().emails.send({
      from: "Supervised Coach <coach@supervised.nl>",
      to: user.email,
      subject: "Stel je wachtwoord in voor Supervised Coach",
      text: `Hoi ${user.name},\n\nJe kunt via onderstaande link je wachtwoord instellen voor Supervised Coach van ${org?.name ?? "je organisatie"}.\n\n${confirmUrl}\n\nDe link is 24 uur geldig.\n\nGroeten,\nSupervised Coach`,
    });
  } catch {
    throw new Error("E-mail kon niet worden verstuurd.");
  }
}

export async function deleteUser(userId: string, organizationId: string | null) {
  await requireRole(["super_admin"]);

  const supabase = createServiceClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(error.message);
  }

  if (organizationId) {
    revalidatePath(`/admin/organizations/${organizationId}`);
    redirect(`/admin/organizations/${organizationId}`);
  } else {
    revalidatePath("/admin");
    redirect("/admin");
  }
}
