"use client";

import { useActionState } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Challenge } from "@/lib/types";
import { eyebrowClass, statusBadgeClass } from "@/lib/ui";

const STATUS_LABELS: Record<Challenge["status"], string> = {
  draft: "Concept",
  active: "Actief",
  completed: "Afgerond",
};

type ActionState = { error: string | null };
const init: ActionState = { error: null };

function wrapAction(action: (formData: FormData) => Promise<void>) {
  return async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
    try {
      await action(formData);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Er ging iets mis." };
    }
  };
}

export function ChallengeEditor({
  challenge,
  updateAction,
  activateAction,
  deleteAction,
  sendMailAction,
}: {
  challenge: Challenge;
  updateAction: (formData: FormData) => Promise<void>;
  activateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  sendMailAction?: (formData: FormData) => Promise<void>;
}) {
  const [updateState, updateFormAction, updatePending] = useActionState(wrapAction(updateAction), init);
  const [activateState, activateFormAction, activatePending] = useActionState(wrapAction(activateAction), init);
  const [deleteState, deleteFormAction, deletePending] = useActionState(wrapAction(deleteAction), init);
  const [sendState, sendFormAction, sendPending] = useActionState(wrapAction(sendMailAction ?? (async () => {})), init);

  return (
    <div className="flex flex-col gap-4 rounded-supervised-md border border-supervised-rule bg-supervised-surface p-6">
      <div className="flex items-center justify-between">
        <span className={eyebrowClass}>Week {challenge.week_number}</span>
        <span className={statusBadgeClass}>{STATUS_LABELS[challenge.status]}</span>
      </div>

      {challenge.status === "draft" ? (
        <>
          <form action={updateFormAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`title-${challenge.id}`}>Titel</Label>
              <Input
                id={`title-${challenge.id}`}
                name="title"
                required
                defaultValue={challenge.title}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`description-${challenge.id}`}>Beschrijving</Label>
              <Textarea
                id={`description-${challenge.id}`}
                name="description"
                required
                defaultValue={challenge.description}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`expectedOutcome-${challenge.id}`}>Verwacht resultaat</Label>
              <Textarea
                id={`expectedOutcome-${challenge.id}`}
                name="expectedOutcome"
                defaultValue={challenge.expected_outcome ?? ""}
              />
            </div>
            {updateState.error ? (
              <p className="text-supervised-sm text-destructive">{updateState.error}</p>
            ) : null}
            <Button type="submit" variant="outline" disabled={updatePending}>
              {updatePending ? "Opslaan…" : "Opslaan"}
            </Button>
          </form>
          <div className="flex flex-wrap gap-3">
            <form action={activateFormAction}>
              {activateState.error ? (
                <p className="mb-3 text-supervised-sm text-destructive">{activateState.error}</p>
              ) : null}
              <ConfirmButton
                type="submit"
                disabled={activatePending}
                confirmMessage="Wil je deze uitdaging activeren? Het team ontvangt een e-mail op het geplande moment voor deze organisatie."
              >
                {activatePending ? "Activeren…" : "Activeren"}
              </ConfirmButton>
            </form>
            <form action={deleteFormAction}>
              {deleteState.error ? (
                <p className="mb-3 text-supervised-sm text-destructive">{deleteState.error}</p>
              ) : null}
              <ConfirmButton
                type="submit"
                variant="destructive"
                disabled={deletePending}
                confirmMessage="Concept verwijderen? Dit kan niet ongedaan worden gemaakt."
              >
                {deletePending ? "Verwijderen…" : "Verwijderen"}
              </ConfirmButton>
            </form>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-medium text-supervised-ink-1">{challenge.title}</h3>
            <p className="text-supervised-sm text-supervised-ink-3 line-clamp-2">{challenge.description}</p>
            {challenge.send_at ? (
              <p className="text-supervised-xs text-supervised-ink-4">
                {challenge.emails_sent
                  ? "E-mail verstuurd"
                  : `Gepland: ${new Date(challenge.send_at).toLocaleDateString("nl-NL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
              </p>
            ) : null}
          </div>
          {challenge.status === "active" && sendMailAction ? (
            <form action={sendFormAction}>
              {sendState.error ? (
                <p className="mb-2 text-supervised-sm text-destructive">{sendState.error}</p>
              ) : null}
              <ConfirmButton
                type="submit"
                variant="outline"
                size="sm"
                disabled={sendPending}
                confirmMessage={`E-mail voor "${challenge.title}" nu versturen naar alle leden? ${challenge.emails_sent ? "Ze hebben deze al eerder ontvangen." : ""}`}
              >
                {sendPending ? "Sturen…" : challenge.emails_sent ? "Opnieuw sturen" : "Nu versturen"}
              </ConfirmButton>
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
