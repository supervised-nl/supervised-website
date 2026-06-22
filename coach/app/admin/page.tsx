import Link from "next/link";

import { deleteUser } from "@/actions/users";
import { ConfirmButton } from "@/components/confirm-button";
import { PageWrapper } from "@/components/page-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { eyebrowClass } from "@/lib/ui";

export default async function AdminPage() {
  await requireRole(["super_admin"]);

  const supabase = createServiceClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: organizations, error },
    { data: allUsers, error: usersError },
    { count: completionsThisWeek },
    { data: activeChallengOrgs },
    { data: orphanedUsers },
  ] = await Promise.all([
    supabase.from("organizations").select("*").order("created_at", { ascending: false }),
    supabase.from("users").select("organization_id, role"),
    supabase
      .from("challenge_completions")
      .select("id", { count: "exact", head: true })
      .gte("completed_at", sevenDaysAgo),
    supabase
      .from("challenges")
      .select("organization_id")
      .eq("status", "active"),
    supabase
      .from("users")
      .select("*")
      .is("organization_id", null)
      .neq("role", "super_admin"),
  ]);

  if (error) throw new Error(error.message);
  if (usersError) throw new Error(usersError.message);

  const userCountByOrg = new Map<string, number>();
  for (const user of allUsers) {
    if (!user.organization_id) continue;
    userCountByOrg.set(user.organization_id, (userCountByOrg.get(user.organization_id) ?? 0) + 1);
  }

  const orgsWithActiveChallenge = new Set((activeChallengOrgs ?? []).map((c) => c.organization_id));
  const totalMembers = allUsers.filter((u) => u.role === "member").length;

  return (
    <PageWrapper>
      <div className="flex flex-col gap-2">
        <h1 className="text-supervised-xl font-light text-supervised-ink-1">Organisaties</h1>
        <p className="text-supervised-sm text-supervised-ink-3">
          {organizations.length} organisatie{organizations.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex gap-6 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <span className="text-supervised-xl font-light text-supervised-ink-1">{totalMembers}</span>
          <span className="text-supervised-xs text-supervised-ink-4">leden totaal</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-supervised-xl font-light text-supervised-ink-1">{orgsWithActiveChallenge.size}</span>
          <span className="text-supervised-xs text-supervised-ink-4">actieve uitdaging</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-supervised-xl font-light text-supervised-ink-1">{completionsThisWeek ?? 0}</span>
          <span className="text-supervised-xs text-supervised-ink-4">afgerond deze week</span>
        </div>
      </div>

      <div className="flex flex-col">
        {organizations.length === 0 ? (
          <p className="text-supervised-ink-3">Nog geen organisaties aangemaakt.</p>
        ) : (
          organizations.map((org) => (
            <Link
              key={org.id}
              href={`/admin/organizations/${org.id}`}
              className="flex items-center justify-between gap-4 py-4 border-b border-supervised-rule last:border-0 group"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <p className="font-medium text-supervised-ink-1 truncate group-hover:text-supervised-ink-2 transition-colors">
                  {org.name}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {org.sector ? <span className={eyebrowClass}>{org.sector}</span> : null}
                  {org.size ? <span className={eyebrowClass}>{org.size}</span> : null}
                  <span className="text-supervised-xs text-supervised-ink-4">
                    {userCountByOrg.get(org.id) ?? 0} gebruikers
                  </span>
                  {orgsWithActiveChallenge.has(org.id) ? (
                    <span className="text-supervised-xs text-emerald-600 font-medium">Actieve uitdaging</span>
                  ) : null}
                </div>
              </div>
              <span className="text-supervised-ink-4 transition-colors group-hover:text-supervised-ink-2 shrink-0">→</span>
            </Link>
          ))
        )}
      </div>

      <Link href="/admin/organizations/new" className={buttonVariants({ variant: "outline" })}>
        Nieuwe organisatie
      </Link>

      {orphanedUsers && orphanedUsers.length > 0 ? (
        <>
          <div className="border-t border-supervised-rule" />
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-supervised-md font-light text-supervised-ink-1">Niet-gekoppelde gebruikers</h2>
              <p className="text-supervised-sm text-supervised-ink-3">
                Deze gebruikers hebben geen organisatie — waarschijnlijk een restant van een verwijderde organisatie.
              </p>
            </div>
            <div className="flex flex-col">
              {orphanedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 py-3 border-b border-supervised-rule last:border-0"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-supervised-sm font-medium text-supervised-ink-1 truncate">
                      {user.name ?? user.email}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={eyebrowClass}>{user.role}</span>
                      {user.name ? (
                        <span className="text-supervised-xs text-supervised-ink-4 truncate">{user.email}</span>
                      ) : null}
                    </div>
                  </div>
                  <form action={deleteUser.bind(null, user.id, null)}>
                    <ConfirmButton
                      type="submit"
                      variant="destructive"
                      size="sm"
                      confirmMessage={`Gebruiker "${user.name ?? user.email}" verwijderen?`}
                    >
                      Verwijderen
                    </ConfirmButton>
                  </form>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </PageWrapper>
  );
}
