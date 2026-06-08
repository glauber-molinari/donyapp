"use client";

import { useMemo, useState } from "react";

import { ContactSearchField, type ContactSearchOption } from "@/components/app/contact-search-field";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { PanelFieldCard } from "@/components/ui/side-panel";
import { Textarea } from "@/components/ui/textarea";

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type InitialAlbumValues = {
  name?: string | null;
  stage_id?: string | null;
  contact_id?: string | null;
  job_date?: string | null;
  deadline?: string | null;
  internal_deadline?: string | null;
  notes?: string | null;
  delivery_link?: string | null;
  work_type_id?: string | null;
};

export type NewAlbumFormProps = {
  formId: string;
  fieldIdPrefix: string;
  contacts: ContactSearchOption[];
  stageOptions: SelectOption[];
  /** Necessário para satisfazer o schema; usamos o primeiro disponível por padrão. */
  workTypeOptions: SelectOption[];
  initialValues?: InitialAlbumValues;
  /** Quando definido, o álbum nasce vinculado a um job de edição. */
  parentJobId?: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

/**
 * Formulário simplificado para o card de Álbum.
 * Não pergunta tipo de entrega (foto/vídeo), editores, tags profissionais
 * ou cartão SD — esses campos não fazem sentido pra produção física.
 */
export function NewAlbumForm({
  formId,
  fieldIdPrefix,
  contacts,
  stageOptions,
  workTypeOptions,
  initialValues,
  parentJobId,
  onSubmit,
}: NewAlbumFormProps) {
  const initial = useMemo(() => initialValues ?? {}, [initialValues]);
  const initialYmd = useMemo(() => todayYmd(), []);

  const [name, setName] = useState(initial.name ?? "");
  const [contactId, setContactId] = useState<string | null>(
    initial.contact_id ?? null
  );
  const [stageId, setStageId] = useState<string>(
    initial.stage_id ?? stageOptions[0]?.value ?? ""
  );
  const [jobDate, setJobDate] = useState(initial.job_date?.slice(0, 10) ?? "");
  const [internalDeadline, setInternalDeadline] = useState(
    initial.internal_deadline?.slice(0, 10) ?? initialYmd
  );
  const [deadline, setDeadline] = useState(
    initial.deadline?.slice(0, 10) ?? initialYmd
  );
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [trackingLink, setTrackingLink] = useState(initial.delivery_link ?? "");
  const [workTypeId] = useState(
    initial.work_type_id ?? workTypeOptions[0]?.value ?? ""
  );

  const id = (suffix: string) => `${fieldIdPrefix}-${suffix}`;

  return (
    <form id={formId} className="flex flex-col gap-3" onSubmit={onSubmit}>
      {/* Campos fixos para satisfazer o schema do `jobs` sem expor pro usuário. */}
      <input type="hidden" name="board_type" value="album" />
      <input type="hidden" name="type" value="foto" />
      <input type="hidden" name="work_type_id" value={workTypeId} />
      {parentJobId ? (
        <input type="hidden" name="parent_job_id" value={parentJobId} />
      ) : null}

      <PanelFieldCard>
        <Input
          id={id("name")}
          name="name"
          label="Título do álbum"
          placeholder="Ex.: Álbum do casamento Maria & João"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Select
          id={id("stage")}
          name="stage_id"
          label="Etapa inicial"
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          options={stageOptions}
          placeholder="Selecione a etapa"
          required
        />
        <ContactSearchField
          id={id("contact")}
          name="contact_id"
          contacts={contacts}
          defaultContactId={contactId}
          onChangeSelectedId={setContactId}
        />
        <Input
          id={id("job-date")}
          name="job_date"
          type="date"
          label="Data do evento"
          hint="Opcional. Data do casamento, ensaio ou sessão que gerou o álbum."
          value={jobDate}
          onChange={(e) => setJobDate(e.target.value)}
        />
        <Textarea
          id={id("notes")}
          name="notes"
          label="Detalhes do álbum"
          placeholder="Formato, número de páginas, tipo de capa, gráfica…"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </PanelFieldCard>

      <PanelFieldCard>
        <Input
          id={id("internal-deadline")}
          name="internal_deadline"
          type="date"
          label="Prazo interno"
          hint="Data limite pra fechar a diagramação e enviar à gráfica."
          value={internalDeadline}
          onChange={(e) => setInternalDeadline(e.target.value)}
          required
        />
        <Input
          id={id("deadline")}
          name="deadline"
          type="date"
          label="Entrega ao cliente"
          hint="Data prevista de chegada do álbum no cliente."
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
        />
        <Input
          id={id("delivery-link")}
          name="delivery_link"
          type="url"
          label="Link"
          placeholder="https://..."
          hint="Opcional. Link do layout final ou link de rastreio de entrega."
          value={trackingLink}
          onChange={(e) => setTrackingLink(e.target.value)}
        />
      </PanelFieldCard>
    </form>
  );
}
