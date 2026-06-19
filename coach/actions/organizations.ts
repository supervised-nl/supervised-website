"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { OrganizationSize } from "@/lib/types";

// De challenge-send cron draait dagelijks (Vercel Hobby), dus het uur is niet
// instelbaar — alleen de dag. We zetten een vaste tijd zodat send_at op de
// juiste dag valt; het exacte uur is verder niet relevant voor de bezorging.
const CHALLENGE_SEND_TIME = "10:00";

function readOrganizationFields(formData: FormData) {
  const name = formData.get("name");
  const sector = formData.get("sector");
  const size = formData.get("size");
  const sendDay = formData.get("challenge_send_day");

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Naam is verplicht.");
  }

  const parsedDay =
    typeof sendDay === "string" && sendDay !== "" && sendDay !== "now"
      ? parseInt(sendDay, 10)
      : null;

  return {
    name: name.trim(),
    sector: typeof sector === "string" && sector.trim() ? sector.trim() : null,
    size: typeof size === "string" && size ? (size as OrganizationSize) : null,
    challenge_send_day: Number.isNaN(parsedDay ?? NaN) ? null : parsedDay,
    challenge_send_time: CHALLENGE_SEND_TIME,
  };
}

export async function createOrganization(formData: FormData) {
  await requireRole(["super_admin"]);
  const fields = readOrganizationFields(formData);

  const supabase = createServiceClient();
  const { data: org, error } = await supabase
    .from("organizations")
    .insert(fields)
    .select("id")
    .single();

  if (error || !org) {
    throw new Error(error?.message ?? "Organisatie aanmaken is mislukt.");
  }

  redirect(`/admin/organizations/${org.id}`);
}

export async function updateOrganization(orgId: string, formData: FormData) {
  await requireRole(["super_admin"]);
  const fields = readOrganizationFields(formData);

  const supabase = createServiceClient();
  const { error } = await supabase.from("organizations").update(fields).eq("id", orgId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/organizations/${orgId}`);
}

export async function deleteOrganization(orgId: string) {
  await requireRole(["super_admin"]);

  const supabase = createServiceClient();
  const { error } = await supabase.from("organizations").delete().eq("id", orgId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  redirect("/admin");
}
