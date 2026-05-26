"use client";

import { Loader2, MessageCircle, Phone, RefreshCw, Send, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { saveWhatsappSettings, saveSenderInstance } from "./notifications-actions";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

interface AccountData {
  whatsapp_number: string | null;
  whatsapp_notifications_enabled: boolean;
  whatsapp_notify_days_before: number[];
  whatsapp_notify_jobs: boolean;
  whatsapp_notify_internal_deadline: boolean;
  whatsapp_notify_tasks: boolean;
  whatsapp_weekly_summary: boolean;
  whatsapp_overdue_alerts: boolean;
  whatsapp_client_delivery_enabled: boolean;
  zapi_sender_instance_id: string | null;
  zapi_sender_token: string | null;
  zapi_sender_connected: boolean;
}

interface Props {
  plan: string;
  isAdmin: boolean;
  account: AccountData;
}


function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-ds-xl border border-ds-border bg-ds-surface p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-ds-ink">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-ds-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

const DAY_OPTIONS = [1, 2, 3, 5, 7] as const;

function formatPhoneDisplay(digits: string): string {
  if (!digits) return "";
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

export function SettingsWhatsappSection({ plan, isAdmin, account }: Props) {
  const isPro = plan === "pro";
  const canEdit = isAdmin && isPro;

  const [enabled, setEnabled] = useState(account.whatsapp_notifications_enabled);
  const [phone, setPhone] = useState(account.whatsapp_number ? formatPhoneDisplay(account.whatsapp_number) : "");
  const [daysBefore, setDaysBefore] = useState<number[]>(account.whatsapp_notify_days_before ?? [1, 3]);
  const [notifyJobs, setNotifyJobs] = useState(account.whatsapp_notify_jobs);
  const [notifyInternal, setNotifyInternal] = useState(account.whatsapp_notify_internal_deadline);
  const [notifyTasks, setNotifyTasks] = useState(account.whatsapp_notify_tasks);
  const [weeklySummary, setWeeklySummary] = useState(account.whatsapp_weekly_summary);
  const [overdueAlerts, setOverdueAlerts] = useState(account.whatsapp_overdue_alerts);
  const [clientDelivery, setClientDelivery] = useState(account.whatsapp_client_delivery_enabled);

  const [instanceId, setInstanceId] = useState(account.zapi_sender_instance_id ?? "");
  const [instanceToken, setInstanceToken] = useState(account.zapi_sender_token ?? "");
  const [senderConnected, setSenderConnected] = useState(account.zapi_sender_connected);

  const [saving, setSaving] = useState(false);
  const [savingInstance, setSavingInstance] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [instanceStatusMsg, setInstanceStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const toggleDay = (d: number) => {
    setDaysBefore((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    const phoneDigits = phone.replace(/\D/g, "");
    const result = await saveWhatsappSettings({
      whatsapp_number: phoneDigits,
      whatsapp_notifications_enabled: enabled,
      whatsapp_notify_days_before: daysBefore.length > 0 ? daysBefore : [1, 3],
      whatsapp_notify_jobs: notifyJobs,
      whatsapp_notify_internal_deadline: notifyInternal,
      whatsapp_notify_tasks: notifyTasks,
      whatsapp_weekly_summary: weeklySummary,
      whatsapp_overdue_alerts: overdueAlerts,
      whatsapp_client_delivery_enabled: clientDelivery,
    });
    setSaving(false);
    setStatusMsg(result.ok ? { type: "success", text: "Configurações salvas." } : { type: "error", text: result.error });
    if (result.ok) setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/whatsapp/test", { method: "POST" });
      const data = await res.json();
      setStatusMsg(
        data.ok
          ? { type: "success", text: "Mensagem de teste enviada! Verifique seu WhatsApp." }
          : { type: "error", text: data.error ?? "Erro ao enviar." }
      );
    } catch {
      setStatusMsg({ type: "error", text: "Erro de conexão." });
    }
    setTesting(false);
  };

  const handleSaveInstance = async () => {
    setSavingInstance(true);
    setInstanceStatusMsg(null);
    const result = await saveSenderInstance({
      zapi_sender_instance_id: instanceId,
      zapi_sender_token: instanceToken,
    });
    setSavingInstance(false);
    setSenderConnected(false);
    setQrBase64(null);
    setInstanceStatusMsg(
      result.ok
        ? { type: "success", text: "Credenciais salvas. Gere o QR code para conectar." }
        : { type: "error", text: result.error }
    );
  };

  const handleGetQr = async () => {
    setLoadingQr(true);
    setQrBase64(null);
    setInstanceStatusMsg(null);
    try {
      const res = await fetch("/api/whatsapp/qr-code");
      const data = await res.json();
      if (data.connected) {
        setSenderConnected(true);
        setInstanceStatusMsg({ type: "success", text: "WhatsApp já conectado!" });
      } else if (data.qrBase64) {
        setQrBase64(data.qrBase64);
        setInstanceStatusMsg({ type: "success", text: "Escaneie o QR code com seu WhatsApp." });
      } else {
        setInstanceStatusMsg({ type: "error", text: data.error ?? "Não foi possível gerar o QR code." });
      }
    } catch {
      setInstanceStatusMsg({ type: "error", text: "Erro de conexão." });
    }
    setLoadingQr(false);
  };

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      if (data.connected && !senderConnected) {
        setSenderConnected(true);
        setQrBase64(null);
        setInstanceStatusMsg({ type: "success", text: `WhatsApp conectado${data.phone ? ` (${data.phone})` : ""}!` });
      }
    } catch {
      /* silent */
    }
  }, [senderConnected]);

  useEffect(() => {
    if (!qrBase64) return;
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [qrBase64, pollStatus]);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setInstanceStatusMsg(null);
    try {
      await fetch("/api/whatsapp/disconnect", { method: "POST" });
      setSenderConnected(false);
      setQrBase64(null);
      setInstanceStatusMsg({ type: "success", text: "WhatsApp desconectado." });
    } catch {
      setInstanceStatusMsg({ type: "error", text: "Erro ao desconectar." });
    }
    setDisconnecting(false);
  };

  if (!isPro) {
    return (
      <div className="rounded-ds-xl border border-ds-border bg-ds-elevated p-6 text-center">
        <MessageCircle className="mx-auto mb-3 h-10 w-10 text-ds-accent opacity-70" />
        <h3 className="text-base font-semibold text-ds-ink">Alertas via WhatsApp</h3>
        <p className="mt-2 text-sm text-ds-muted">
          Receba alertas de prazo, resumo semanal e entregue materiais aos clientes pelo WhatsApp. Exclusivo do plano Pro.
        </p>
        <a
          href="/settings/plan"
          className="mt-4 inline-flex items-center gap-2 rounded-ds-xl bg-ds-accent px-4 py-2 text-sm font-semibold text-white hover:bg-ds-accent/90 transition-colors"
        >
          Fazer upgrade para Pro
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Main toggle + number */}
      <Section
        title="Notificações de prazo"
        description="Receba alertas no WhatsApp quando prazos de edições ou tarefas estiverem chegando."
      >
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-sm font-medium text-ds-ink">Ativar alertas</p>
            <p className="text-xs text-ds-muted">Envia mensagens para o número abaixo</p>
          </div>
          <Switch checked={enabled} onChange={setEnabled} disabled={!canEdit} />
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-ds-ink" htmlFor="whatsapp-number">
            Seu número de WhatsApp
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted" />
            <input
              id="whatsapp-number"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(51) 99999-9999"
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                setPhone(formatPhoneDisplay(digits));
              }}
              disabled={!canEdit}
              className="w-full rounded-ds-xl border border-ds-border bg-ds-surface py-2.5 pl-9 pr-3 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent focus:outline-none focus:ring-2 focus:ring-ds-accent/25 disabled:opacity-50"
            />
          </div>
          <p className="mt-1 text-xs text-ds-muted">DDD + número. Ex.: 51999998888</p>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-ds-ink">Avisar com antecedência de:</p>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => canEdit && toggleDay(d)}
                disabled={!canEdit}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${daysBefore.includes(d) ? "border-ds-accent bg-ds-accent text-white" : "border-ds-border bg-ds-surface text-ds-muted hover:border-ds-accent/50"} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {d === 1 ? "1 dia" : `${d} dias`}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-2">
          <p className="text-sm font-medium text-ds-ink">Alertar sobre:</p>
          <Checkbox checked={notifyJobs} onChange={(e) => canEdit && setNotifyJobs(e.target.checked)} label="Prazos de entrega (clientes)" />
          <Checkbox checked={notifyInternal} onChange={(e) => canEdit && setNotifyInternal(e.target.checked)} label="Prazos internos de produção" />
          <Checkbox checked={notifyTasks} onChange={(e) => canEdit && setNotifyTasks(e.target.checked)} label="Tarefas" />
          <Checkbox checked={overdueAlerts} onChange={(e) => canEdit && setOverdueAlerts(e.target.checked)} label="Alertas de atraso (prazos já vencidos)" />
        </div>

        <div className="mb-5 flex items-center justify-between gap-4 rounded-ds-xl border border-ds-border p-4">
          <div>
            <p className="text-sm font-medium text-ds-ink">Resumo semanal às segundas</p>
            <p className="text-xs text-ds-muted">Receba um resumo das entregas e tarefas toda segunda-feira de manhã</p>
          </div>
          <Switch checked={weeklySummary} onChange={setWeeklySummary} disabled={!canEdit} />
        </div>

        {statusMsg ? (
          <Alert
            variant={statusMsg.type === "success" ? "success" : "danger"}
            onDismiss={() => setStatusMsg(null)}
            className="mb-4"
          >
            {statusMsg.text}
          </Alert>
        ) : null}

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-ds-xl bg-ds-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ds-accent/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar configurações
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !phone}
              className="flex items-center gap-2 rounded-ds-xl border border-ds-border bg-ds-surface px-4 py-2 text-sm font-medium text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar mensagem de teste
            </button>
          </div>
        )}
      </Section>

      {/* Client delivery */}
      <Section
        title="Entrega ao cliente via WhatsApp"
        description="Habilita o envio do link de material direto pelo WhatsApp no quadro de edições."
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ds-ink">Ativar envio ao cliente</p>
            <p className="text-xs text-ds-muted">Aparece como opção ao lado do botão de e-mail no quadro</p>
          </div>
          <Switch checked={clientDelivery} onChange={canEdit ? setClientDelivery : () => {}} disabled={!canEdit} />
        </div>
        {canEdit && clientDelivery && (
          <p className="mt-3 text-xs text-ds-muted">
            Certifique-se de que os contatos têm telefone cadastrado para usar este recurso.
            O template de mensagem pode ser personalizado em{" "}
            <a href="/settings/email" className="text-ds-accent hover:underline">Configurações → E-mail</a>.
          </p>
        )}
      </Section>

      {/* Sender instance (photographer's own WhatsApp) */}
      <Section
        title="Meu WhatsApp como remetente"
        description="Conecte seu número para enviar entregas aos clientes da sua conta Z-API. Requer uma instância Z-API própria."
      >
        <div className="mb-4 flex items-center gap-2">
          {senderConnected ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <Wifi className="h-4 w-4" /> Conectado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-ds-muted">
              <WifiOff className="h-4 w-4" /> Desconectado
            </span>
          )}
        </div>

        {!senderConnected && (
          <>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-ds-ink" htmlFor="instance-id">
                Instance ID (Z-API)
              </label>
              <input
                id="instance-id"
                type="text"
                placeholder="Ex.: 3B0B37BD0E63..."
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-ds-xl border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent focus:outline-none focus:ring-2 focus:ring-ds-accent/25 disabled:opacity-50"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-ds-ink" htmlFor="instance-token">
                Token da instância
              </label>
              <input
                id="instance-token"
                type="password"
                placeholder="Cole o token da instância Z-API"
                value={instanceToken}
                onChange={(e) => setInstanceToken(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-ds-xl border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent focus:outline-none focus:ring-2 focus:ring-ds-accent/25 disabled:opacity-50"
              />
            </div>
          </>
        )}

        {instanceStatusMsg ? (
          <Alert
            variant={instanceStatusMsg.type === "success" ? "success" : "danger"}
            onDismiss={() => setInstanceStatusMsg(null)}
            className="mb-3"
          >
            {instanceStatusMsg.text}
          </Alert>
        ) : null}

        {qrBase64 && (
          <div className="mb-4 flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrBase64} alt="QR Code WhatsApp" className="h-48 w-48 rounded-ds-xl border border-ds-border" />
            <p className="text-xs text-ds-muted">Abra o WhatsApp → Dispositivos Vinculados → Vincular Dispositivo</p>
            <div className="flex items-center gap-1 text-xs text-ds-muted animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" /> Aguardando conexão...
            </div>
          </div>
        )}

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {!senderConnected && (
              <>
                <button
                  type="button"
                  onClick={handleSaveInstance}
                  disabled={savingInstance || !instanceId || !instanceToken}
                  className="flex items-center gap-2 rounded-ds-xl border border-ds-border bg-ds-surface px-3 py-2 text-sm font-medium text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink disabled:opacity-50"
                >
                  {savingInstance ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Salvar credenciais
                </button>
                <button
                  type="button"
                  onClick={handleGetQr}
                  disabled={loadingQr || !instanceId || !instanceToken}
                  className="flex items-center gap-2 rounded-ds-xl bg-ds-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-ds-accent/90 disabled:opacity-50"
                >
                  {loadingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Gerar QR Code
                </button>
              </>
            )}
            {senderConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 rounded-ds-lg border border-ds-danger/20 bg-ds-danger-soft px-3 py-2 text-sm font-medium text-ds-danger transition-colors hover:bg-ds-danger hover:text-white disabled:opacity-50"
              >
                {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WifiOff className="h-4 w-4" />}
                Desconectar WhatsApp
              </button>
            )}
          </div>
        )}

        <div className="mt-4 rounded-ds-xl border border-ds-border/50 bg-ds-elevated p-3">
          <p className="text-xs text-ds-muted">
            <strong className="text-ds-ink">Como configurar:</strong> Acesse{" "}
            <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer" className="text-ds-accent hover:underline">app.z-api.io</a>,
            crie uma instância, copie o Instance ID e o Token e cole acima. Depois gere o QR code e escaneie com seu WhatsApp.
          </p>
        </div>
      </Section>
    </div>
  );
}
