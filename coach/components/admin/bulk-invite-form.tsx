"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type State = { error: string | null; sent: number; failed: string[] } | null;

export function BulkInviteForm({
  action,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bulk-emails">E-mailadressen</Label>
        <Textarea
          id="bulk-emails"
          name="emails"
          required
          rows={5}
          placeholder={"jan@bedrijf.nl\nMaria de Vries <maria@bedrijf.nl>\npiet@bedrijf.nl"}
          className="font-mono text-supervised-xs"
        />
        <p className="text-supervised-xs text-supervised-ink-4">
          Één adres per regel. Optioneel: Naam &lt;email&gt; — anders wordt het gedeelte voor @ als naam gebruikt.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bulk-role">Rol</Label>
        <Select name="role" defaultValue="member">
          <SelectTrigger id="bulk-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Medewerker</SelectItem>
            <SelectItem value="admin">Beheerder</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {state?.error ? (
        <p className="text-supervised-sm text-destructive">{state.error}</p>
      ) : null}
      {state && !state.error ? (
        <div className="flex flex-col gap-1">
          <p className="text-supervised-sm text-supervised-ink-2">
            {state.sent} uitnodiging{state.sent !== 1 ? "en" : ""} verstuurd.
          </p>
          {state.failed.length > 0 ? (
            <p className="text-supervised-sm text-destructive">
              Mislukt: {state.failed.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Sturen…" : "Uitnodigingen sturen"}
      </Button>
    </form>
  );
}
