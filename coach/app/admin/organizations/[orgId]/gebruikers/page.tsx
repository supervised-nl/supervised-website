import Link from "next/link";
import { notFound } from "next/navigation";

import { bulkInviteUsers, inviteUser, deleteUser, resendInvite } from "@/actions/users";
import { BulkInviteForm } from "@/components/admin/bulk-invite-form";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { ResendInviteButton } from "@/components/admin/resend-invite-button";
import { BackLink } from "@/components/back-link";
import { ConfirmButton } from "@/components/confirm-button";
import { PageWrapper } from "@/components/page-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { eyebrowClass } from "@/lib/ui";

export default async function OrganizationUsersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  await requireRole(["super_admin"]);
  const { orgId } = await params;

  const supabase = createServiceClient();

  const [
    { data: org, error: orgError },
    { data: users, error: usersError },
    { data: { users: authUsers } },
  ] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
    supabase.from("users").select("*").eq("organization_id", orgId).order("created_at", { ascending: true }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (orgError) throw new Error(orgError.message);
  if (!org) notFound();
  if (usersError) throw new Error(usersError.message);

  const lastSignInMap = new Map(authUsers.map((u) => [u.id, u.last_sign_in_at ?? null]));

  return (
    <PageWrapper>
      <BackLink href={`/admin/organizations/${orgId}`}>Terug naar {org.name}</BackLink>

      <div className="flex flex-col gap-2">
        <h1 className="text-supervised-xl font-light text-supervised-ink-1">Gebruikers</h1>
        <p className="text-supervised-sm text-supervised-ink-3">
          {users.length} gebruiker{users.length !== 1 ? "s" : ""} in {org.name}
        </p>
      </div>

      <div className="flex flex-col">
        {users.length === 0 ? (
          <p className="text-supervised-ink-3">Nog geen gebruikers in deze organisatie.</p>
        ) : (
          users.map((user) => {
            const hasSignedIn = !!lastSignInMap.get(user.id);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 py-3 border-b border-supervised-rule last:border-0"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-supervised-sm font-medium text-supervised-ink-1 truncate">
                    {user.name ?? user.email}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={eyebrowClass}>{user.role}</span>
                    {user.name ? (
                      <span className="text-supervised-xs text-supervised-ink-4 truncate">{user.email}</span>
                    ) : null}
                    {!hasSignedIn ? (
                      <span className="text-supervised-xs text-amber-600 font-medium">Nooit ingelogd</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ResendInviteButton action={resendInvite.bind(null, user.id, orgId)} />
                  <Link
                    href={`/admin/users/${user.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Wijzigen
                  </Link>
                  <form action={deleteUser.bind(null, user.id, orgId)}>
                    <ConfirmButton
                      type="submit"
                      variant="destructive"
                      size="sm"
                      confirmMessage={`Gebruiker "${user.name ?? user.email}" verwijderen? Dit kan niet ongedaan worden gemaakt.`}
                    >
                      Verwijderen
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-supervised-rule" />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-supervised-md font-light text-supervised-ink-1">Uitnodiging sturen</h2>
          <p className="text-supervised-sm text-supervised-ink-3">
            Ze ontvangen een e-mail met een link om direct in te loggen.
          </p>
        </div>
        <InviteUserForm action={inviteUser.bind(null, orgId)} />
      </section>

      <div className="border-t border-supervised-rule" />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-supervised-md font-light text-supervised-ink-1">Meerdere uitnodigen</h2>
          <p className="text-supervised-sm text-supervised-ink-3">
            Plak meerdere e-mailadressen in één keer. Ze krijgen allemaal dezelfde rol.
          </p>
        </div>
        <BulkInviteForm action={bulkInviteUsers.bind(null, orgId)} />
      </section>
    </PageWrapper>
  );
}
