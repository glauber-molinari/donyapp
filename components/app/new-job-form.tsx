"use client";

import { useMemo, useState } from "react";

import { ContactSearchField, type ContactSearchOption } from "@/components/app/contact-search-field";
import { SdCardTagsField } from "@/components/app/sd-card-tags-field";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { PanelFieldCard } from "@/components/ui/side-panel";
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

export type NewJobTab = "info" | "prazos";

export type InitialJobValues = {
  name?: string | null;
  stage_id?: string | null;
  job_date?: string | null;
  contact_id?: string | null;
  work_type_id?: string | null;
  sd_card_tags?: string[];
  notes?: string | null;
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
  memberOptions: SelectOption[];
  /** Pro + um usuário: lista de responsáveis cadastrados manualmente em Configurações → Kanban. */
  manualAssigneeOptions?: SelectOption[];
  /** Quando true, usa `manualAssigneeOptions` em vez de membros da equipe para foto/vídeo. */
  useManualAssigneeDirectory?: boolean;
  /** Valores iniciais para pré-preencher o formulário (modo edição). */
  initialValues?: InitialJobValues;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  /**
   * Aba ativa (modo controlado). Use junto de `onTabChange` no modal de criação:
   * prazos ficam inativos no HTML até a aba Prazos, para `reportValidity` na etapa Informações.
   */
  tab?: NewJobTab;
  onTabChange?: (tab: NewJobTab) => void;
};

export function NewJobForm({
  formId,
  fieldIdPrefix,
  contacts,
  stageOptions,
  workTypeOptions,
  memberOptions,
  manualAssigneeOptions = [],
  useManualAssigneeDirectory = false,
  initialValues,
  onSubmit,
  tab: tabControlled,
  onTabChange,
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

  /** Valores iniciais fixos por montagem do formulário (datas independentes entre si). */
  const initialYmd = useMemo(() => todayYmd(), []);

  const hasTeamMembers = memberOptions.length > 0;
  const showManualDirectory =
    useManualAssigneeDirectory && manualAssigneeOptions.length > 0;
  const manualDirectoryEmpty =
    useManualAssigneeDirectory && manualAssigneeOptions.length === 0;

  return (
    <form id={formId} className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div
        className="flex gap-0.5 rounded-ds-xl border border-app-border bg-ds-cream/40 p-1"
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
            "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            tab === "prazos"
              ? "bg-app-sidebar text-ds-ink shadow-sm"
              : "text-ds-muted hover:text-ds-ink"
          )}
          onClick={() => setTab("prazos")}
        >
          Prazos e entrega
        </button>
      </div>

      {/* Ambos os painéis permanecem no DOM para o envio incluir todos os campos (ex.: work_type_id na aba Informações). */}
      <div
        className={cn("flex flex-col gap-3", tab !== "info" && "hidden")}
        role="tabpanel"
        aria-hidden={tab !== "info"}
      >
        <PanelFieldCard>
          <Select
            id={`${fieldIdPrefix}-stage`}
            name="stage_id"
            label="Coluna Inicial"
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
            placeholder={workTypeOptions.length ? "Selecione" : "Cadastre tipos em Configurações"}
            options={workTypeOptions}
            disabled={workTypeOptions.length === 0}
            defaultValue={initialValues?.work_type_id ?? ""}
          />
          {workTypeOptions.length === 0 ? (
            <p className="text-xs text-amber-800">
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
            defaultValue={initialValues?.internal_deadline?.slice(0, 10) ?? initialYmd}
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
          <Input
            id={`${fieldIdPrefix}-delivery-link`}
            name="delivery_link"
            type="text"
            label="Link de entrega"
            placeholder="https://… (opcional)"
            defaultValue={initialValues?.delivery_link ?? ""}
          />

          {showManualDirectory ? (
            <>
              <input type="hidden" name="photo_editor_id" value="" />
              <input type="hidden" name="video_editor_id" value="" />
              {deliveryType === "foto_video" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Select
                    id={`${fieldIdPrefix}-photo-manual`}
                    name="photo_manual_assignee_id"
                    label="Responsável pela foto"
                    required={manualAssigneeOptions.length > 1}
                    placeholder={manualAssigneeOptions.length > 1 ? "Selecione" : undefined}
                    defaultValue={
                      initialValues?.photo_manual_assignee_id ??
                      (manualAssigneeOptions.length === 1 ? manualAssigneeOptions[0]!.value : "")
                    }
                    options={manualAssigneeOptions}
                  />
                  <Select
                    id={`${fieldIdPrefix}-video-manual`}
                    name="video_manual_assignee_id"
                    label="Responsável pelo vídeo"
                    required={manualAssigneeOptions.length > 1}
                    placeholder={manualAssigneeOptions.length > 1 ? "Selecione" : undefined}
                    defaultValue={
                      initialValues?.video_manual_assignee_id ??
                      (manualAssigneeOptions.length === 1 ? manualAssigneeOptions[0]!.value : "")
                    }
                    options={manualAssigneeOptions}
                  />
                </div>
              ) : (
                <Select
                  id={`${fieldIdPrefix}-manual-editor`}
                  name={
                    deliveryType === "video"
                      ? "video_manual_assignee_id"
                      : "photo_manual_assignee_id"
                  }
                  label="Responsável"
                  required={manualAssigneeOptions.length > 1}
                  placeholder={manualAssigneeOptions.length > 1 ? "Selecione" : undefined}
                  defaultValue={
                    deliveryType === "video"
                      ? (initialValues?.video_manual_assignee_id ??
                          (manualAssigneeOptions.length === 1
                            ? manualAssigneeOptions[0]!.value
                            : ""))
                      : (initialValues?.photo_manual_assignee_id ??
                          (manualAssigneeOptions.length === 1
                            ? manualAssigneeOptions[0]!.value
                            : ""))
                  }
                  options={manualAssigneeOptions}
                />
              )}
            </>
          ) : manualDirectoryEmpty ? (
            <div className="rounded-ds-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-950">
              <p className="font-medium">Responsáveis</p>
              <p className="mt-1 text-amber-900/90">
                Cadastre responsáveis manuais em{" "}
                <strong>Configurações → Kanban → Responsáveis</strong> para atribuir foto e vídeo
                sem convidar usuários. Por ora o job pode ser salvo sem responsáveis definidos.
              </p>
              <input type="hidden" name="photo_editor_id" value="" />
              <input type="hidden" name="video_editor_id" value="" />
              <input type="hidden" name="photo_manual_assignee_id" value="" />
              <input type="hidden" name="video_manual_assignee_id" value="" />
            </div>
          ) : !hasTeamMembers ? (
            <div className="rounded-ds-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-950">
              <p className="font-medium">Responsáveis</p>
              <p className="mt-1 text-amber-900/90">
                Não há outros usuários na equipe. Convide membros em{" "}
                <strong>Configurações</strong> para atribuir responsáveis por foto e vídeo. Por ora
                o job pode ser salvo sem responsáveis definidos.
              </p>
              <input type="hidden" name="photo_editor_id" value="" />
              <input type="hidden" name="video_editor_id" value="" />
            </div>
          ) : deliveryType === "foto_video" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                id={`${fieldIdPrefix}-photo-editor`}
                name="photo_editor_id"
                label="Responsável pela foto"
                required={memberOptions.length > 1}
                placeholder={memberOptions.length > 1 ? "Selecione" : undefined}
                defaultValue={
                  initialValues?.photo_editor_id ??
                  (memberOptions.length === 1 ? memberOptions[0]!.value : "")
                }
                options={memberOptions}
              />
              <Select
                id={`${fieldIdPrefix}-video-editor`}
                name="video_editor_id"
                label="Responsável pelo vídeo"
                required={memberOptions.length > 1}
                placeholder={memberOptions.length > 1 ? "Selecione" : undefined}
                defaultValue={
                  initialValues?.video_editor_id ??
                  (memberOptions.length === 1 ? memberOptions[0]!.value : "")
                }
                options={memberOptions}
              />
            </div>
          ) : (
            <Select
              id={`${fieldIdPrefix}-editor`}
              name={deliveryType === "video" ? "video_editor_id" : "photo_editor_id"}
              label="Responsável"
              required={memberOptions.length > 1}
              placeholder={memberOptions.length > 1 ? "Selecione" : undefined}
              defaultValue={
                deliveryType === "video"
                  ? (initialValues?.video_editor_id ??
                      (memberOptions.length === 1 ? memberOptions[0]!.value : ""))
                  : (initialValues?.photo_editor_id ??
                      (memberOptions.length === 1 ? memberOptions[0]!.value : ""))
              }
              options={memberOptions}
            />
          )}
        </PanelFieldCard>

        {deliveryType === "foto_video" ? (
          <div className="rounded-ds-xl border border-sky-200 bg-sky-50/90 p-4">
            <p className="text-sm font-semibold text-sky-950">Edição de vídeo</p>
            <p className="mt-1 text-xs text-sky-900/85">
              Será criado um card adicional no quadro só para acompanhar a edição de vídeo deste
              job.
            </p>
          </div>
        ) : null}
        </fieldset>
      </div>

    </form>
  );
}
