"use client";

import { CheckCircle2, FileText, Upload, XCircle } from "lucide-react";
import { useRef, useState } from "react";

import { importContacts, type ImportContactRow } from "./import-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── CSV parser ──────────────────────────────────────────────────────────────

/** Detecta o delimitador predominante na primeira linha (vírgula ou ponto-e-vírgula). */
function detectDelimiter(firstLine: string): "," | ";" {
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

/** Parse simples de uma linha CSV respeitando campos entre aspas. */
function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === delimiter) {
        fields.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  fields.push(cur.trim());
  return fields;
}

/** Normaliza nomes de colunas para detecção flexível. */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-záéíóúâêîôûãõç]/gi, "");
}

const HEADER_ALIASES: Record<string, keyof ImportContactRow> = {
  nome: "name",
  name: "name",
  email: "email",
  emaill: "email",
  telefone: "phone",
  phone: "phone",
  tel: "phone",
  celular: "phone",
  fone: "phone",
};

// Remove alias duplicado (TS não deixa, mas é para clareza)
type ParseResult =
  | { ok: true; rows: ImportContactRow[]; total: number; invalid: number }
  | { ok: false; error: string };

function parseCsv(text: string): ParseResult {
  // Remove BOM UTF-8 que o Excel adiciona
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) {
    return { ok: false, error: "A planilha deve ter pelo menos uma linha de cabeçalho e um contato." };
  }

  const delimiter = detectDelimiter(lines[0]!);
  const headers = parseCsvLine(lines[0]!, delimiter).map(normalizeHeader);

  // Mapeia índice da coluna para campo
  const colMap: Partial<Record<keyof ImportContactRow, number>> = {};
  headers.forEach((h, i) => {
    const field = HEADER_ALIASES[h];
    if (field && colMap[field] === undefined) colMap[field] = i;
  });

  if (colMap.name === undefined) {
    return { ok: false, error: 'Coluna "nome" não encontrada. Verifique o cabeçalho da planilha.' };
  }
  if (colMap.email === undefined) {
    return { ok: false, error: 'Coluna "email" não encontrada. Verifique o cabeçalho da planilha.' };
  }

  const rows: ImportContactRow[] = [];
  let invalid = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]!, delimiter);
    const name = fields[colMap.name!]?.trim() ?? "";
    const email = fields[colMap.email!]?.trim() ?? "";
    const phone = colMap.phone !== undefined ? (fields[colMap.phone]?.trim() || null) : null;

    // Linha vazia: ignora silenciosamente
    if (!name && !email) continue;

    // Linha com dados mas inválida: conta como inválida
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      invalid++;
      continue;
    }

    rows.push({ name, email, phone });
  }

  return { ok: true, rows, total: rows.length + invalid, invalid };
}

// ─── Componente ──────────────────────────────────────────────────────────────

type ImportStatus =
  | { type: "idle" }
  | { type: "parsed"; rows: ImportContactRow[]; total: number; invalid: number }
  | { type: "loading" }
  | { type: "success"; imported: number; skipped: number; limitReached: boolean }
  | { type: "error"; message: string };

export function SettingsImportSection() {
  const [status, setStatus] = useState<ImportStatus>({ type: "idle" });
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus({ type: "idle" });

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCsv(text);
      if (!result.ok) {
        setStatus({ type: "error", message: result.error });
        return;
      }
      if (result.rows.length === 0) {
        setStatus({ type: "error", message: "Nenhum contato válido encontrado na planilha." });
        return;
      }
      setStatus({ type: "parsed", rows: result.rows, total: result.total, invalid: result.invalid });
    };
    reader.onerror = () => setStatus({ type: "error", message: "Não foi possível ler o arquivo." });
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    if (status.type !== "parsed") return;
    setStatus({ type: "loading" });
    const res = await importContacts(status.rows);
    if (!res.ok) {
      setStatus({ type: "error", message: res.error });
      return;
    }
    setStatus({
      type: "success",
      imported: res.imported,
      skipped: res.skipped,
      limitReached: res.limitReached,
    });
    // Limpa o input para permitir reimportação
    if (inputRef.current) inputRef.current.value = "";
    setFileName(null);
  }

  function reset() {
    setStatus({ type: "idle" });
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-ds-ink">Importar contatos</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Faça upload de uma planilha <strong>.csv</strong> para adicionar contatos em lote. A
          planilha deve ter as colunas <strong>nome</strong>, <strong>email</strong> e,
          opcionalmente, <strong>telefone</strong> — nesta ordem ou com esses nomes no cabeçalho.
        </p>
      </div>

      {/* Instruções de formato */}
      <div className="rounded-xl border border-app-border bg-ds-cream/50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ds-subtle">
          Formato esperado
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-app-border">
                <th className="pb-1.5 pr-6 text-left font-semibold text-ds-muted">nome</th>
                <th className="pb-1.5 pr-6 text-left font-semibold text-ds-muted">email</th>
                <th className="pb-1.5 text-left font-semibold text-ds-muted">telefone</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 pr-6 text-ds-ink">João Silva</td>
                <td className="py-1 pr-6 text-ds-ink">joao@email.com</td>
                <td className="py-1 text-ds-ink">(11) 99999-0000</td>
              </tr>
              <tr>
                <td className="py-1 pr-6 text-ds-ink">Maria Lima</td>
                <td className="py-1 pr-6 text-ds-ink">maria@email.com</td>
                <td className="py-1 text-ds-muted">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-ds-subtle">
          Separadores aceitos: vírgula (,) ou ponto-e-vírgula (;). Exportado pelo Excel ou Google
          Planilhas.
        </p>
      </div>

      {/* Upload */}
      <div className="flex flex-col gap-3">
        <label
          htmlFor="csv-upload"
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
            status.type === "error"
              ? "border-red-300 bg-red-50"
              : "border-app-border bg-app-sidebar hover:border-app-primary/40 hover:bg-ds-cream/40"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ds-cream text-ds-muted">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <div className="text-center">
            {fileName ? (
              <p className="text-sm font-medium text-ds-ink">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-ds-ink">
                  Clique para selecionar o arquivo
                </p>
                <p className="mt-0.5 text-xs text-ds-muted">Apenas arquivos .csv</p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            id="csv-upload"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>

        {/* Preview dos dados parseados */}
        {status.type === "parsed" && (
          <div className="rounded-xl border border-app-border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ds-ink">
                  {status.rows.length} contato{status.rows.length !== 1 ? "s" : ""} prontos para
                  importar
                </p>
                {status.invalid > 0 && (
                  <p className="mt-0.5 text-xs text-amber-700">
                    {status.invalid} linha{status.invalid !== 1 ? "s" : ""} ignorada
                    {status.invalid !== 1 ? "s" : ""} (nome ou e-mail inválido)
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={reset}
                className="text-xs text-ds-muted hover:text-ds-ink"
              >
                Remover
              </button>
            </div>

            {/* Mini preview: primeiros 5 contatos */}
            <ul className="mt-3 divide-y divide-app-border/60">
              {status.rows.slice(0, 5).map((r, i) => (
                <li key={i} className="flex items-center gap-3 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ds-ink">{r.name}</p>
                    <p className="truncate text-[11px] text-ds-muted">{r.email}</p>
                  </div>
                  {r.phone ? (
                    <span className="shrink-0 text-[11px] text-ds-subtle">{r.phone}</span>
                  ) : null}
                </li>
              ))}
              {status.rows.length > 5 && (
                <li className="py-1.5 text-[11px] text-ds-subtle">
                  + {status.rows.length - 5} mais…
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Resultado da importação */}
        {status.type === "success" && (
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              <p className="text-sm font-semibold text-emerald-800">
                {status.imported} contato{status.imported !== 1 ? "s" : ""} importado
                {status.imported !== 1 ? "s" : ""} com sucesso
              </p>
            </div>
            {status.skipped > 0 && (
              <p className="text-xs text-emerald-700">
                {status.skipped} linha{status.skipped !== 1 ? "s" : ""} ignorada
                {status.skipped !== 1 ? "s" : ""} (e-mail inválido ou dados ausentes
                {status.limitReached ? " ou limite do plano Free atingido" : ""}).
              </p>
            )}
            {status.limitReached && status.skipped === 0 && (
              <p className="text-xs text-amber-700">
                Limite do plano Free atingido — alguns contatos não foram importados.
              </p>
            )}
            <button
              type="button"
              onClick={reset}
              className="mt-1 self-start text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
            >
              Importar outro arquivo
            </button>
          </div>
        )}

        {/* Erro */}
        {status.type === "error" && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-red-800">Erro na importação</p>
              <p className="mt-0.5 text-xs text-red-700">{status.message}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-2 text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-900"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Botão importar */}
        {(status.type === "parsed" || status.type === "loading") && (
          <Button
            type="button"
            size="md"
            disabled={status.type === "loading"}
            onClick={handleImport}
            className="self-start"
          >
            <Upload className="h-4 w-4" aria-hidden />
            {status.type === "loading" ? "Importando…" : `Importar ${status.type === "parsed" ? status.rows.length : ""} contato${status.type === "parsed" && status.rows.length !== 1 ? "s" : ""}`}
          </Button>
        )}
      </div>
    </div>
  );
}
