-- Permite ao fotógrafo "destravar" a seleção do cliente para que ele escolha de novo.
-- Seleções enviadas antes desse timestamp passam a ser ignoradas (sem apagar histórico).

alter table public.galleries
  add column if not exists selection_reset_at timestamptz;
