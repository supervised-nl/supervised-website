"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

type State = { error: string | null; sent: boolean };
const init: State = { error: null, sent: false };

export function ResendInviteButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: State): Promise<State> => {
      try {
        await action();
        return { error: null, sent: true };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Er ging iets mis.", sent: false };
      }
    },
    init,
  );

  if (state.sent) {
    return <span className="text-supervised-xs text-supervised-ink-3">Link verstuurd</span>;
  }

  return (
    <form action={formAction}>
      <Button type="submit" variant="outline" size="sm" disabled={pending} title={state.error ?? undefined}>
        {pending ? "Sturen…" : "Nieuwe link"}
      </Button>
    </form>
  );
}
