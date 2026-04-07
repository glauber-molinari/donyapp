"use client";

import { useState } from "react";

import { ContactSearchField, type ContactSearchOption } from "@/components/app/contact-search-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

const JOB_DELIVERY_OPTIONS: { value: JobRow["type"]; label: string }[] = [
  { value: "foto", label: "Foto" },
  { value: "video", label: "Vídeo" },
  { value: "foto_video", label: "Foto e Vídeo" },
];

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type NewJobTab = "info" | "prazos";

export type NewJobFormProps = {
  /** Prefixo único para ids (ex.: `job-create` ou `board-job-create`). */
  fieldIdPrefix: string;
  contacts: ContactSearchOption[];
  stageOptions: SelectOption[];
  workTypeOptions: SelectOption[];
  memberOptions: SelectOption[];
  singleMemberId: string | null;
  membersCount: number;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function NewJobForm({
  fieldIdPrefix,
  contacts,
  stageOptions,
  workTypeOptions,
  memberOptions,
  singleMemberId,
  membersCount,
  isPending,
  onCancel,
  onSubmit,
}: NewJobFormProps) {
  const [tab, setTab] = useState<NewJobTab>("info");
  const [deliveryType, setDeliveryType] = useState<JobRow["type"]>("foto");

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div
        className="flex rounded-ds-lg border border-app-border bg-ds-cream/40 p-1"
        role="tablist"
        aria-label="Seções do formulário"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "info"}
          className={cn(
            "flex-1 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "info"
              ? "bg-app-sidebar text-ds-ink shadow-sm"
              : "text-ds-muted hover:text-ds-ink"
          )}
          onClick={() => setTab("info")}
        >
          Informações
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "prazos"}
          className={cn(
            "flex-1 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "prazos"
              ? "bg-app-sidebar text-ds-ink shadow-sm"
              : "text-ds-muted hover:text-ds-ink"
          )}
          onClick={() => setTab("prazos")}
        >
          Prazos e entrega
        </button>
      </div>

      {tab === "info" ? (
        <div className="flex flex-col gap-4" role="tabpanel">
          <Select
            id={`${fieldIdPrefix}-stage`}
            name="stage_id"
            label="Coluna Inicial"
            required
            placeholder="Selecione a etapa"
            options={stageOptions}
          />
          <Input
            id={`${fieldIdPrefix}-job-date`}
            name="job_date"
            type="date"
            label="Data Job"
            defaultValue={todayYmd()}
          />
          <Input id={`${fieldIdPrefix}-name`} name="name" label="Nome do Job" required />
          <ContactSearchField id={`${fieldIdPrefix}-contact`} contacts={contacts} />
          <Select
            id={`${fieldIdPrefix}-work-type`}
            name="work_type_id"
            label="Tipo do Job"
            required={workTypeOptions.length > 0}
            placeholder={workTypeOptions.length ? "Selecione" : "Cadastre tipos em Configurações"}
            options={workTypeOptions}
            disabled={workTypeOptions.length === 0}
          />
          {workTypeOptions.length === 0 ? (
            <p className="text-xs text-amber-800">
              Adicione tipos em <strong>Configurações → Kanban</strong>.
            </p>
          ) : null}
          <Textarea
            id={`${fieldIdPrefix}-notes`}
            name="notes"
            label="Observações"
            placeholder="Opcional"
            rows={3}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4" role="tabpanel">
          <Input
            id={`${fieldIdPrefix}-internal`}
            name="internal_deadline"
            type="date"
            label="Prazo interno"
            required
            defaultValue={todayYmd()}
          />
          <Input
            id={`${fieldIdPrefix}-final`}
            name="deadline"
            type="date"
            label="Prazo final"
            required
            defaultValue={todayYmd()}
          />
          <Select
            id={`${fieldIdPrefix}-delivery-type`}
            name="type"
            label="Tipo de entrega"
            required
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value as JobRow["type"])}
            options={JOB_DELIVERY_OPTIONS}
          />
          {membersCount <= 1 ? (
            <>
              <input type="hidden" name="photo_editor_id" value={singleMemberId ?? ""} />
              <input type="hidden" name="video_editor_id" value={singleMemberId ?? ""} />
            </>
          ) : deliveryType === "foto_video" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                id={`${fieldIdPrefix}-photo-editor`}
                name="photo_editor_id"
                label="Responsável pela foto"
                required
                placeholder="Selecione"
                options={memberOptions}
              />
              <Select
                id={`${fieldIdPrefix}-video-editor`}
                name="video_editor_id"
                label="Responsável pelo vídeo"
                required
                placeholder="Selecione"
                options={memberOptions}
              />
            </div>
          ) : (
            <Select
              id={`${fieldIdPrefix}-editor`}
              name={deliveryType === "video" ? "video_editor_id" : "photo_editor_id"}
              label="Responsável"
              required
              placeholder="Selecione"
              options={memberOptions}
            />
          )}
          {deliveryType === "video" || deliveryType === "foto_video" ? (
            <div className="rounded-ds-xl border border-sky-200 bg-sky-50/90 p-4">
              <p className="text-sm font-semibold text-sky-950">Edição de vídeo</p>
              <p className="mt-1 text-xs text-sky-900/85">
                Será criado um card adicional no quadro só para acompanhar a edição de vídeo deste
                job.
              </p>
            </div>
          ) : null}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || workTypeOptions.length === 0}>
          {isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
