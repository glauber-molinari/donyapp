"use client";

import { useEffect, useMemo, useState } from "react";

import { JobAssigneesMultiField } from "@/components/app/job-assignees-multi-field";
import {
  ContactSearchField,
  type ContactSearchOption,
} from "@/components/app/contact-search-field";
import { SdCardTagsField } from "@/components/app/sd-card-tags-field";
import type { JobAssigneePickerOption } from "@/lib/build-job-assignee-picker-options";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { PanelFieldCard } from "@/components/ui/side-panel";
import { Switch } from "@/components/ui/switch";
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

function legacyAssigneeTokensFromInitial(
  iv: InitialJobValues,
  role: "photo" | "video"
): string[] {
  if (role === "photo") {
    const t: string[] = [];
    if (iv.photo_manual_assignee_id) t.push(`m:${iv.photo_manual_assignee_id}`);
    if (iv.photo_editor_id) t.push(`u:${iv.photo_editor_id}`);
    return t;
  }
  const t: string[] = [];
  if (iv.video_manual_assignee_id) t.push(`m:${iv.video_manual_assignee_id}`);
  if (iv.video_editor_id) t.push(`u:${iv.video_editor_id}`);
  return t;
}

export type NewJobTab = "info" | "prazos";

export type InitialJobValues = {
  name?: string | null;
  stage_id?: string | null;
  job_date?: string | null;
  contact_id?: string | null;
  work_type_id?: string | null;
  sd_card_tags?: string[];
  notes?: string | null;
  professional_photo_tags?: string[];
  professional_video_tags?: string[];
  internal_deadline?: string | null;
  deadline?: string | null;
  type?: JobRow["type"] | null;
  delivery_link?: string | null;
  photo_editor_id?: string | null;
  video_editor_id?: string | null;
  photo_manual_assignee_id?: string | null;
  video_manual_assignee_id?: string | null;
};

export type NewJobFormProps = {
  /** Id do elemento form — usado pelo footer do Modal para referenciar o submit. */
  formId: string;
  /** Prefixo único para ids (ex.: `job-create` ou `board-job-create`). */
  fieldIdPrefix: string;
  contacts: ContactSearchOption[];
  stageOptions: SelectOption[];
  workTypeOptions: SelectOption[];
  /** Lista unificada: responsáveis manuais, administradores e equipe. */
  assigneePickerOptions: JobAssigneePickerOption[];
  /** Modo edição: tokens iniciais por papel (opcional se `initialValues` tiver legado). */
  initialAssigneePhotoTokens?: string[];
  initialAssigneeVideoTokens?: string[];
  /** Valores iniciais para pré-preencher o formulário (modo edição). */
  initialValues?: InitialJobValues;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  /**
   * Aba ativa (modo controlado). Use junto de `onTabChange` no modal de criação:
   * prazos ficam inativos no HTML até a aba Prazos, para `reportValidity` na etapa Informações.
   */
  tab?: NewJobTab;
  onTabChange?: (tab: NewJobTab) => void;
  /** Mostrar toggle "Ativar portal do cliente" (apenas no modo criação). */
  enablePortalOnCreate?: boolean;
  onPortalToggleChange?: (enabled: boolean) => void;
};

export function NewJobForm({
  formId,
  fieldIdPrefix,
  contacts,
  stageOptions,
  workTypeOptions,
  assigneePickerOptions,
  initialAssigneePhotoTokens,
  initialAssigneeVideoTokens,
  initialValues,
  onSubmit,
  tab: tabControlled,
  onTabChange,
  enablePortalOnCreate = false,
  onPortalToggleChange,
}: NewJobFormProps) {
  const [tabInternal, setTabInternal] = useState<NewJobTab>("info");
  const tab = tabControlled ?? tabInternal;
  const setTab = (next: NewJobTab) => {
    onTabChange?.(next);
    if (tabControlled === undefined) setTabInternal(next);
  };
  const twoStepCreate = tabControlled !== undefined && onTabChange !== undefined;
  const [deliveryType, setDeliveryType] = useState<JobRow["type"]>(
    initialValues?.type ?? "foto"
  );

  useEffect(() => {
    setDeliveryType(initialValues?.type ?? "foto");
  }, [formId, initialValues?.type]);

  /** Valores iniciais fixos por montagem do formulário (datas independentes entre si). */
  const initialYmd = useMemo(() => todayYmd(), []);

  const validTokenSet = useMemo(
    () => new Set(assigneePickerOptions.map((o) => o.token)),
    [assigneePickerOptions]
  );

  const defaultPhotoTokens = useMemo(() => {
    const fromProp = (initialAssigneePhotoTokens ?? []).filter((t) =>
      validTokenSet.has(t)
    );
    if (fromProp.length > 0) return fromProp;
    if (initialValues) {
      const fromLegacy = legacyAssigneeTokensFromInitial(initialValues, "photo").filter(
        (t) => validTokenSet.has(t)
      );
      if (fromLegacy.length > 0) return fromLegacy;
    }
    if (assigneePickerOptions.length === 1) return [assigneePickerOptions[0]!.token];
    return [];
  }, [initialAssigneePhotoTokens, initialValues, assigneePickerOptions, validTokenSet]);

  const defaultVideoTokens = useMemo(() => {
    const fromProp = (initialAssigneeVideoTokens ?? []).filter((t) =>
      validTokenSet.has(t)
    );
    if (fromProp.length > 0) return fromProp;
    if (initialValues) {
      const fromLegacy = legacyAssigneeTokensFromInitial(initialValues, "video").filter(
        (t) => validTokenSet.has(t)
      );
      if (fromLegacy.length > 0) return fromLegacy;
    }
    if (assigneePickerOptions.length === 1) return [assigneePickerOptions[0]!.token];
    return [];
  }, [initialAssigneeVideoTokens, initialValues, assigneePickerOptions, validTokenSet]);

  const requireAssigneePick = assigneePickerOptions.length > 1;

  return (
    <form id={formId} className="flex flex-col gap-4" onSubmit={onSubmit}>
      <input
        type="hidden"
        name="assignee_picker_option_count"
        value={assigneePickerOptions.length}
      />

      <div
        className="flex gap-0.5 rounded-ds-lg border border-ds-border bg-ds-cream/40 p-1"
        role="tablist"
        aria-label="Seções do formulário"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "info"}
          className={cn(
            "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            tab === "info"
              ? "bg-ds-surface text-ds-ink shadow-ds-sm"
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
            "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            tab === "prazos"
              ? "bg-ds-surface text-ds-ink shadow-ds-sm"
              : "text-ds-muted hover:text-ds-ink"
          )}
          onClick={() => setTab("prazos")}
        >
          Prazos e entrega
        </button>
      </div>

      <div
        className={cn("flex flex-col gap-3", tab !== "info" && "hidden")}
        role="tabpanel"
        aria-hidden={tab !== "info"}
      >
        <PanelFieldCard>
          <Select
            id={`${fieldIdPrefix}-stage`}
            name="stage_id"
            label="Status inicial"
            required
            placeholder="Selecione a etapa"
            options={stageOptions}
            defaultValue={initialValues?.stage_id ?? ""}
          />
          <Input
            id={`${fieldIdPrefix}-job-date`}
            name="job_date"
            type="date"
            label="Data do trabalho"
            hint="Data em que ocorreu a sessão de fotos ou a gravação."
            defaultValue={initialValues?.job_date?.slice(0, 10) ?? initialYmd}
          />
          <Input
            id={`${fieldIdPrefix}-name`}
            name="name"
            label="Nome do Job"
            required
            defaultValue={initialValues?.name ?? ""}
          />
          <ContactSearchField
            id={`${fieldIdPrefix}-contact`}
            contacts={contacts}
            defaultContactId={initialValues?.contact_id ?? null}
          />
          <Select
            id={`${fieldIdPrefix}-work-type`}
            name="work_type_id"
            label="Tipo do Job"
            required={workTypeOptions.length > 0}
            placeholder={
              workTypeOptions.length ? "Selecione" : "Cadastre tipos em Configurações"
            }
            options={workTypeOptions}
            disabled={workTypeOptions.length === 0}
            defaultValue={initialValues?.work_type_id ?? ""}
          />
          {workTypeOptions.length === 0 ? (
            <p className="text-xs text-ds-warn">
              Adicione tipos em <strong>Configurações → Kanban</strong>.
            </p>
          ) : null}
          <SdCardTagsField
            id={`${fieldIdPrefix}-sd-card-tags`}
            label="Cartão SD"
            hint="Opcional. Texto livre (ex.: 001). Enter adiciona; vírgula ou ponto e vírgula separam vários de uma vez."
            initialTags={initialValues?.sd_card_tags}
          />
          <Textarea
            id={`${fieldIdPrefix}-notes`}
            name="notes"
            label="Observações"
            placeholder="Opcional"
            rows={3}
            defaultValue={initialValues?.notes ?? ""}
          />
        </PanelFieldCard>
      </div>

      <div
        className={cn("flex flex-col gap-3", tab !== "prazos" && "hidden")}
        role="tabpanel"
        aria-hidden={tab !== "prazos"}
      >
        <fieldset
          disabled={twoStepCreate && tab !== "prazos"}
          className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0 disabled:[&_button]:pointer-events-none"
        >
          <PanelFieldCard>
            <Input
              id={`${fieldIdPrefix}-internal`}
              name="internal_deadline"
              type="date"
              label="Prazo interno"
              required
              defaultValue={
                initialValues?.internal_deadline?.slice(0, 10) ?? initialYmd
              }
            />
            <Input
              id={`${fieldIdPrefix}-final`}
              name="deadline"
              type="date"
              label="Prazo final"
              required
              defaultValue={initialValues?.deadline?.slice(0, 10) ?? initialYmd}
            />
          </PanelFieldCard>

          <PanelFieldCard>
            <Select
              id={`${fieldIdPrefix}-delivery-type`}
              name="type"
              label="Tipo de entrega"
              required
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value as JobRow["type"])}
              options={JOB_DELIVERY_OPTIONS}
            />
            <div className={cn(deliveryType === "video" && "hidden")}>
              <SdCardTagsField
                id={`${fieldIdPrefix}-prof-photo`}
                name="professional_photo_tags"
                label={
                  deliveryType === "foto_video" ? "Quem fotografou" : "Profissional"
                }
                hint="Opcional. Vários nomes: vírgula, ponto e vírgula ou Enter para cada um."
                placeholder="Ex.: Mariana ou Rafael"
                initialTags={initialValues?.professional_photo_tags ?? []}
              />
            </div>
            <div className={cn(deliveryType === "foto" && "hidden")}>
              <SdCardTagsField
                id={`${fieldIdPrefix}-prof-video`}
                name="professional_video_tags"
                label={deliveryType === "foto_video" ? "Quem filmou" : "Profissional"}
                hint="Opcional. Vários nomes: vírgula, ponto e vírgula ou Enter para cada um."
                placeholder="Ex.: Mariana ou Rafael"
                initialTags={initialValues?.professional_video_tags ?? []}
              />
            </div>
            <Input
              id={`${fieldIdPrefix}-delivery-link`}
              name="delivery_link"
              type="text"
              label="Link de entrega"
              placeholder="https://… (opcional)"
              defaultValue={initialValues?.delivery_link ?? ""}
            />

            {onPortalToggleChange !== undefined ? (
              <div className="rounded-ds-lg border border-ds-border bg-ds-cream/60 px-4 py-3">
                <Switch
                  id={`${fieldIdPrefix}-portal-toggle`}
                  checked={enablePortalOnCreate}
                  onChange={onPortalToggleChange}
                  label="Ativar portal do cliente"
                  hint="Gera um link público para o cliente acompanhar o andamento do job."
                />
              </div>
            ) : null}

            {deliveryType === "foto_video" ? (
              <div className="flex min-w-0 flex-col gap-5">
                <JobAssigneesMultiField
                  id={`${fieldIdPrefix}-assign-photo`}
                  name="assignee_photo"
                  label="Responsáveis pela foto"
                  options={assigneePickerOptions}
                  defaultSelectedTokens={defaultPhotoTokens}
                  requireSelection={requireAssigneePick}
                  disabled={twoStepCreate && tab !== "prazos"}
                />
                <JobAssigneesMultiField
                  id={`${fieldIdPrefix}-assign-video`}
                  name="assignee_video"
                  label="Responsáveis pelo vídeo"
                  options={assigneePickerOptions}
                  defaultSelectedTokens={defaultVideoTokens}
                  requireSelection={requireAssigneePick}
                  disabled={twoStepCreate && tab !== "prazos"}
                />
              </div>
            ) : (
              <JobAssigneesMultiField
                id={`${fieldIdPrefix}-assign-single`}
                name={deliveryType === "video" ? "assignee_video" : "assignee_photo"}
                label="Responsáveis"
                options={assigneePickerOptions}
                defaultSelectedTokens={
                  deliveryType === "video" ? defaultVideoTokens : defaultPhotoTokens
                }
                requireSelection={requireAssigneePick}
                disabled={twoStepCreate && tab !== "prazos"}
              />
            )}
          </PanelFieldCard>

          {deliveryType === "foto_video" ? (
            <div className="rounded-ds-lg border border-ds-info/20 bg-ds-info-soft p-4">
              <p className="text-sm font-semibold text-ds-ink">Edição de vídeo</p>
              <p className="mt-1 text-xs text-ds-info">
                Será criado um card adicional no quadro só para acompanhar a edição de
                vídeo deste job.
              </p>
            </div>
          ) : null}
        </fieldset>
      </div>
    </form>
  );
}
