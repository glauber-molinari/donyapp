"use client";

import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createGallery } from "@/lib/gallery/actions";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  name: string;
  job_date: string | null;
}

interface Props {
  jobs: Job[];
}

const inputCls =
  "w-full rounded-ds-lg border border-ds-border bg-ds-surface px-3 py-2.5 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20";

function formatJobDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function NovaGaleriaClient({ jobs }: Props) {
  const router = useRouter();
  const [selectedJobId, setSelectedJobId] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  function handleJobChange(jobId: string) {
    setSelectedJobId(jobId);
    const job = jobs.find((j) => j.id === jobId);
    if (job && !title) setTitle(job.name);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJobId || !title.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createGallery(selectedJobId, title.trim());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/galerias/${res.gallery.id}`);
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 py-4 md:py-10">
      <div className="flex items-center gap-3">
        <Link
          href="/galerias"
          className="flex h-9 w-9 items-center justify-center rounded-ds-lg border border-ds-border bg-ds-surface text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
          aria-label="Voltar para galerias"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-medium text-ds-muted">Nova galeria</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ds-ink">Criar nova galeria</h1>
        <p className="text-sm text-ds-muted">
          Escolha o job e defina o nome da galeria para começar o upload.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-ds-card border border-ds-border bg-ds-surface p-6 text-sm text-ds-muted">
          Todos os seus jobs já têm galeria. Crie um novo job para abrir outra galeria.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gallery-job" className="text-xs font-medium text-ds-muted-2">
              Job
            </label>
            <select
              id="gallery-job"
              value={selectedJobId}
              onChange={(e) => handleJobChange(e.target.value)}
              className={cn(inputCls, "appearance-none")}
              required
            >
              <option value="">Selecione um job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="gallery-title" className="text-xs font-medium text-ds-muted-2">
              Nome da galeria
            </label>
            <input
              id="gallery-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Exemplo: Jessie e Ryan"
              className={inputCls}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="gallery-date" className="text-xs font-medium text-ds-muted-2">
              Data do evento
            </label>
            <div className="relative">
              <input
                id="gallery-date"
                type="text"
                readOnly
                value={formatJobDate(selectedJob?.job_date ?? null) ?? ""}
                placeholder="Definida no job"
                className={cn(inputCls, "pr-10 text-ds-muted")}
              />
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted-2" />
            </div>
            <p className="text-xs text-ds-muted">
              Vem do job selecionado. Para alterar, edite o job em Pós-Produção.
            </p>
          </div>

          {error ? (
            <p className="rounded-ds-md border border-ds-danger/30 bg-ds-danger-soft px-3 py-2 text-sm text-ds-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={!selectedJobId || !title.trim() || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Criar galeria
          </Button>
        </form>
      )}
    </div>
  );
}
