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

export async function deleteUser(userId: string, organizationId: string) {
  await requireRole(["super_admin"]);

  const supabase = createServiceClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/organizations/${organizationId}`);
  redirect(`/admin/organizations/${organizationId}`);
}
