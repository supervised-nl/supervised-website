import { notFound } from "next/navigation";

import { activateChallenge, deleteChallenge, generateChallenge, sendChallengeMail, updateChallenge } from "@/actions/challenge";
import { ChallengeEditor } from "@/components/admin/challenge-editor";
import { GenerateChallengeButton } from "@/components/admin/generate-challenge-button";
import { BackLink } from "@/components/back-link";
import { PageWrapper } from "@/components/page-wrapper";
import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

export default async function ChallengesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  await requireRole(["super_admin"]);
  const { orgId } = await params;

  const supabase = createServiceClient();

  const [
    { data: org, error: orgError },
    { data: challenges, error: challengesError },
  ] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
    supabase.from("challenges").select("*").eq("organization_id", orgId).order("week_number", { ascending: false }),
  ]);

  if (orgError) throw new Error(orgError.message);
  if (!org) notFound();
  if (challengesError) throw new Error(challengesError.message);

  return (
    <PageWrapper>
      <BackLink href={`/admin/organizations/${orgId}`}>Terug naar {org.name}</BackLink>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-supervised-xl font-light text-supervised-ink-1">Uitdagingen {org.name}</h1>
        <GenerateChallengeButton action={generateChallenge.bind(null, orgId)} />
      </div>

      <div className="flex flex-col gap-4">
        {challenges.length === 0 ? (
          <p className="text-supervised-ink-3">Nog geen uitdagingen voor deze organisatie.</p>
        ) : (
          challenges.map((challenge) => (
            <ChallengeEditor
              key={challenge.id}
              challenge={challenge}
              updateAction={updateChallenge.bind(null, challenge.id)}
              activateAction={activateChallenge.bind(null, challenge.id)}
              deleteAction={deleteChallenge.bind(null, challenge.id)}
              sendMailAction={sendChallengeMail.bind(null, challenge.id)}
            />
          ))
        )}
      </div>
    </PageWrapper>
  );
}
