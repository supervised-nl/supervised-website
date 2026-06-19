"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Organization, OrganizationSize } from "@/lib/types";

const SIZE_OPTIONS: OrganizationSize[] = ["1-5", "5-15", "15-50", "50+"];

const DAY_OPTIONS = [
  { value: "now", label: "Meteen bij activering" },
  { value: "1", label: "Maandag" },
  { value: "2", label: "Dinsdag" },
  { value: "3", label: "Woensdag" },
  { value: "4", label: "Donderdag" },
  { value: "5", label: "Vrijdag" },
  { value: "6", label: "Zaterdag" },
  { value: "0", label: "Zondag" },
];

export function OrganizationForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Pick<Organization, "name" | "sector" | "size" | "challenge_send_day">;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Naam</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sector">Sector</Label>
        <Input id="sector" name="sector" defaultValue={defaultValues?.sector ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="size">Aantal medewerkers</Label>
        <Select name="size" defaultValue={defaultValues?.size ?? undefined}>
          <SelectTrigger id="size" className="w-full">
            <SelectValue placeholder="Kies een grootte" />
          </SelectTrigger>
          <SelectContent>
            {SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="challenge_send_day">Uitdaging versturen op</Label>
        <Select
          name="challenge_send_day"
          defaultValue={
            defaultValues?.challenge_send_day != null
              ? String(defaultValues.challenge_send_day)
              : "1"
          }
        >
          <SelectTrigger id="challenge_send_day" className="w-full">
            <SelectValue placeholder="Kies een dag" />
          </SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-supervised-xs text-supervised-ink-4">
          Uitdagingen gaan op de gekozen dag in de ochtend de deur uit.
        </p>
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
