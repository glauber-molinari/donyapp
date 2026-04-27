"use client";

import {
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Columns3,
  FileText,
  LaptopMinimal,
  LayoutDashboard,
  Mail,
  NotebookPen,
  Settings,
  Sparkles,
  Users,
  BarChart3,
  Target,
  Zap,
  Shield,
  Clock,
  Heart,
  Camera,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const slides = [
  {
    id: "intro",
    title: "Bem-vindo ao Dony",
    subtitle: "Gestão de pós-produção pensada para fotógrafos",
    icon: Camera,
    content: (
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="relative h-32 w-32 sm:h-40 sm:w-40">
          <Image
            src="/brand/logo-dony-png.png"
            alt="Donyapp"
            fill
            className="object-contain"
            priority
          />
        </div>
        <p className="max-w-2xl text-center text-xl text-ds-muted sm:text-2xl">
          A ferramenta que transforma o caos da pós-produção em um fluxo organizado e previsível
        </p>
      </div>
    ),
  },
  {
    id: "problema",
    title: "O Problema",
    subtitle: "Você reconhece isso?",
    icon: Target,
    content: (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            "Planilhas desatualizadas com informações conflitantes",
            "Cliente perguntando no WhatsApp quando fica pronto",
            "Equipe perdida sobre quem faz o quê",
            "Prazos perdidos por falta de visibilidade",
            "Arquivos espalhados em vários lugares",
            "Dificuldade em escalar o estúdio",
          ].map((problem, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-ds-xl border border-red-200 bg-red-50 p-4"
            >
              <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                ✕
              </div>
              <p className="text-sm text-red-900">{problem}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "solucao",
    title: "A Solução",
    subtitle: "Dony organiza tudo em um só lugar",
    icon: Sparkles,
    content: (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Visão centralizada",
              desc: "Todo o fluxo em um Kanban visual",
              color: "emerald",
            },
            {
              title: "Prazos claros",
              desc: "Todos sabem o que precisa ser feito e quando",
              color: "blue",
            },
            {
              title: "Equipe alinhada",
              desc: "Colaboração em tempo real",
              color: "purple",
            },
            {
              title: "Cliente informado",
              desc: "Comunicação profissional automatizada",
              color: "orange",
            },
          ].map((solution, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-ds-xl border p-4",
                solution.color === "emerald" && "border-emerald-200 bg-emerald-50",
                solution.color === "blue" && "border-blue-200 bg-blue-50",
                solution.color === "purple" && "border-purple-200 bg-purple-50",
                solution.color === "orange" && "border-orange-200 bg-orange-50"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center font-bold text-sm",
                  solution.color === "emerald" && "bg-emerald-100 text-emerald-600",
                  solution.color === "blue" && "bg-blue-100 text-blue-600",
                  solution.color === "purple" && "bg-purple-100 text-purple-600",
                  solution.color === "orange" && "bg-orange-100 text-orange-600"
                )}
              >
                ✓
              </div>
              <div className="flex flex-col gap-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    solution.color === "emerald" && "text-emerald-900",
                    solution.color === "blue" && "text-blue-900",
                    solution.color === "purple" && "text-purple-900",
                    solution.color === "orange" && "text-orange-900"
                  )}
                >
                  {solution.title}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    solution.color === "emerald" && "text-emerald-700",
                    solution.color === "blue" && "text-blue-700",
                    solution.color === "purple" && "text-purple-700",
                    solution.color === "orange" && "text-orange-700"
                  )}
                >
                  {solution.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard",
    subtitle: "Visão geral do seu estúdio",
    icon: LayoutDashboard,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-app-border bg-white p-6 shadow-ds-card">
          <p className="mb-4 text-sm text-ds-muted">
            Acompanhe métricas importantes em tempo real
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Jobs ativos", value: "24", change: "+3 esta semana" },
              { label: "Prazos próximos", value: "5", change: "Nos próximos 7 dias" },
              { label: "Jobs entregues", value: "142", change: "Este mês" },
            ].map((metric, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-ds-xl border border-ds-border bg-ds-cream p-4"
              >
                <p className="text-xs font-medium text-ds-muted">{metric.label}</p>
                <p className="text-3xl font-bold text-ds-ink">{metric.value}</p>
                <p className="text-xs text-ds-subtle">{metric.change}</p>
              </div>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Visão rápida do status do estúdio",
            "Indicadores de prazo e urgência",
            "Métricas de produtividade",
            "Histórico de entregas",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ds-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-app-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "kanban",
    title: "Kanban de Edição",
    subtitle: "O coração do Dony",
    icon: Columns3,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-app-border bg-white p-6 shadow-ds-card">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { name: "Backup", count: 3, color: "bg-gray-100" },
              { name: "Em Edição", count: 8, color: "bg-blue-100" },
              { name: "Em Aprovação", count: 5, color: "bg-yellow-100" },
              { name: "Entregue", count: 142, color: "bg-green-100" },
            ].map((stage, i) => (
              <div
                key={i}
                className="min-w-[140px] flex-1 rounded-ds-xl border border-ds-border bg-ds-cream p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-ds-ink">{stage.name}</p>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-app-primary text-[10px] font-bold text-white">
                    {stage.count}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {Array.from({ length: Math.min(stage.count, 2) }).map((_, j) => (
                    <div
                      key={j}
                      className={cn("h-12 rounded-lg border border-ds-border", stage.color)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Etapas customizáveis conforme seu fluxo",
            "Arrastar e soltar para mover jobs",
            "Etapas ilimitadas (personalize à vontade)",
            "Filtros por prazo, cliente e responsável",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ds-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-app-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "jobs",
    title: "Gestão de Jobs",
    subtitle: "Cada projeto organizado nos mínimos detalhes",
    icon: LaptopMinimal,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-app-border bg-white p-6 shadow-ds-card">
          <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-ds-xl border border-ds-border bg-ds-cream p-4">
              <div className="flex-1">
                <p className="font-semibold text-ds-ink">Casamento Maria & João</p>
                <p className="mt-1 text-xs text-ds-muted">Cliente: Studio Silva</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Casamento
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Em dia
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-ds-subtle">Prazo</p>
                <p className="text-sm font-semibold text-ds-ink">15/05/2026</p>
              </div>
            </div>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Título, descrição e tipo de trabalho",
            "Prazo com alertas automáticos",
            "Cliente vinculado ao job",
            "Responsável pelo job",
            "Link para arquivos (Drive, Dropbox, etc)",
            "Observações e histórico",
            "Etiquetas e categorias",
            "Status visual de urgência",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ds-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-app-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "contacts",
    title: "Gestão de Contatos",
    subtitle: "Todos os seus clientes organizados",
    icon: Users,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-app-border bg-white p-6 shadow-ds-card">
          <div className="space-y-2">
            {[
              { name: "Studio Silva", email: "contato@studiosilva.com", jobs: 12 },
              { name: "Ana Costa Fotografia", email: "ana@costa.com", jobs: 8 },
              { name: "Eventos Premium", email: "eventos@premium.com", jobs: 15 },
            ].map((contact, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-ds-xl border border-ds-border bg-ds-cream p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ds-ink">{contact.name}</p>
                  <p className="text-xs text-ds-muted">{contact.email}</p>
                </div>
                <span className="rounded-full bg-app-primary px-2 py-1 text-xs font-semibold text-white">
                  {contact.jobs} jobs
                </span>
              </div>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Cadastro completo de clientes",
            "Busca rápida por nome ou e-mail",
            "Histórico de todos os jobs do cliente",
            "Contatos ilimitados",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ds-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-app-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "team",
    title: "Trabalho em Equipe",
    subtitle: "Colaboração perfeita para estúdios",
    icon: Users,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-app-border bg-white p-6 shadow-ds-card">
          <p className="mb-4 text-sm text-ds-muted">Convide sua equipe por e-mail</p>
          <div className="space-y-2">
            {[
              { name: "João Silva", role: "Editor", avatar: "JS" },
              { name: "Maria Santos", role: "Fotógrafa", avatar: "MS" },
              { name: "Pedro Costa", role: "Colorista", avatar: "PC" },
            ].map((member, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-ds-xl border border-ds-border bg-ds-cream p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-app-primary text-sm font-bold text-white">
                  {member.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ds-ink">{member.name}</p>
                  <p className="text-xs text-ds-muted">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Multi-usuário ilimitado",
            "Convites por e-mail",
            "Permissões e controle de acesso",
            "Todos veem os mesmos dados atualizados",
            "Atribuir responsáveis aos jobs",
            "Histórico de ações",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ds-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-app-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "notes",
    title: "Anotações",
    subtitle: "Suas ideias e lembretes sempre à mão",
    icon: NotebookPen,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-app-border bg-white p-6 shadow-ds-card">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Reunião com cliente",
                date: "15 Abr",
                preview: "Discutir alterações no projeto X...",
              },
              {
                title: "Ideias para workflow",
                date: "12 Abr",
                preview: "Testar novo processo de backup...",
              },
              {
                title: "Configurações de cor",
                date: "10 Abr",
                preview: "LUT padrão para eventos corporativos...",
              },
              {
                title: "Lista de equipamentos",
                date: "08 Abr",
                preview: "Verificar manutenção das câmeras...",
              },
            ].map((note, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-ds-xl border border-ds-border bg-ds-cream p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ds-ink">{note.title}</p>
                  <span className="text-xs text-ds-subtle">{note.date}</span>
                </div>
                <p className="text-xs text-ds-muted">{note.preview}</p>
              </div>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Anotações ilimitadas",
            "Editor de texto rico",
            "Busca por título ou conteúdo",
            "Organização por data",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ds-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-app-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "agenda",
    title: "Agenda Integrada",
    subtitle: "Sincronização com Google Calendar",
    icon: Calendar,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-app-border bg-white p-6 shadow-ds-card">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-ds-xl border border-ds-border bg-ds-cream">
              <Calendar className="h-6 w-6 text-app-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ds-ink">Google Calendar conectado</p>
              <p className="text-xs text-ds-muted">Seus eventos sincronizados automaticamente</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { time: "09:00", event: "Ensaio pré-casamento", type: "Sessão" },
              { time: "14:00", event: "Entrega editado - Cliente X", type: "Entrega" },
              { time: "16:30", event: "Reunião com fornecedor", type: "Reunião" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-ds-xl border border-ds-border bg-ds-cream p-3"
              >
                <div className="text-center">
                  <p className="text-xs font-bold text-ds-ink">{item.time}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ds-ink">{item.event}</p>
                  <p className="text-xs text-ds-muted">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Sincronização bidirecional com Google Calendar",
            "Visualização de eventos e prazos",
            "Criar eventos diretamente no Dony",
            "Alertas e notificações",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ds-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-app-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "tasks",
    title: "Tarefas",
    subtitle: "Organize o trabalho em pequenas ações",
    icon: CheckSquare,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-app-border bg-white p-6 shadow-ds-card">
          <div className="space-y-2">
            {[
              { task: "Fazer backup dos arquivos brutos", done: true },
              { task: "Editar fotos selecionadas", done: true },
              { task: "Aplicar correção de cor", done: false },
              { task: "Exportar em alta resolução", done: false },
              { task: "Enviar para cliente", done: false },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-ds-xl border border-ds-border bg-ds-cream p-3"
              >
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border-2",
                    item.done
                      ? "border-green-500 bg-green-500"
                      : "border-ds-border bg-white"
                  )}
                >
                  {item.done && <span className="text-xs text-white">✓</span>}
                </div>
                <p
                  className={cn(
                    "flex-1 text-sm",
                    item.done ? "text-ds-muted line-through" : "text-ds-ink font-medium"
                  )}
                >
                  {item.task}
                </p>
              </div>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Lista de tarefas por job",
            "Marcar como concluído",
            "Atribuir responsáveis",
            "Prazos por tarefa",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ds-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-app-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "reports",
    title: "Relatórios",
    subtitle: "Insights para tomar decisões",
    icon: BarChart3,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-app-border bg-white p-6 shadow-ds-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-ds-xl border border-ds-border bg-ds-cream p-4">
              <p className="text-xs font-medium text-ds-muted">Taxa de conclusão</p>
              <p className="mt-2 text-3xl font-bold text-ds-ink">87%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ds-border">
                <div className="h-full w-[87%] rounded-full bg-green-500" />
              </div>
            </div>
            <div className="rounded-ds-xl border border-ds-border bg-ds-cream p-4">
              <p className="text-xs font-medium text-ds-muted">Tempo médio de entrega</p>
              <p className="mt-2 text-3xl font-bold text-ds-ink">5.2 dias</p>
              <p className="mt-1 text-xs text-green-600">↓ 12% vs mês anterior</p>
            </div>
            <div className="rounded-ds-xl border border-ds-border bg-ds-cream p-4">
              <p className="text-xs font-medium text-ds-muted">Jobs este mês</p>
              <p className="mt-2 text-3xl font-bold text-ds-ink">34</p>
              <p className="mt-1 text-xs text-green-600">↑ 8 vs mês anterior</p>
            </div>
            <div className="rounded-ds-xl border border-ds-border bg-ds-cream p-4">
              <p className="text-xs font-medium text-ds-muted">Clientes ativos</p>
              <p className="mt-2 text-3xl font-bold text-ds-ink">18</p>
              <p className="mt-1 text-xs text-ds-subtle">15 recorrentes</p>
            </div>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Métricas de produtividade",
            "Análise de prazos",
            "Performance da equipe",
            "Relatórios por período",
            "Clientes mais ativos",
            "Tipos de trabalho mais frequentes",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ds-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-app-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "email",
    title: "E-mail Automático",
    subtitle: "Comunicação profissional com o cliente",
    icon: Mail,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-app-border bg-white p-6 shadow-ds-card">
          <div className="rounded-lg border border-ds-border bg-ds-cream p-4">
            <div className="mb-3 flex items-center justify-between border-b border-ds-border pb-3">
              <p className="text-xs font-semibold text-ds-ink">Para: cliente@exemplo.com</p>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Enviado
              </span>
            </div>
            <p className="text-sm font-bold text-ds-ink">
              Seu material está pronto! 🎉
            </p>
            <p className="mt-3 text-sm text-ds-muted">
              Olá, tudo bem?
            </p>
            <p className="mt-2 text-sm text-ds-muted">
              Seu material está finalizado e pronto para download. Você pode acessar através do link abaixo:
            </p>
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-900">
                🔗 https://drive.google.com/exemplo
              </p>
            </div>
            <p className="mt-3 text-sm text-ds-muted">
              Qualquer dúvida, estou à disposição!
            </p>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Envio automático ao mover para 'Entregue'",
            "Modelos de e-mail customizáveis",
            "Variáveis dinâmicas (nome, prazo, link)",
            "Histórico de e-mails enviados",
            "Confirmação antes de enviar",
            "Personalização por tipo de trabalho",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ds-muted">
              <div className="h-1.5 w-1.5 rounded-full bg-app-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "settings",
    title: "Configurações",
    subtitle: "Personalize o Dony do seu jeito",
    icon: Settings,
    content: (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Etapas do Kanban",
              desc: "Personalize nomes, ordem e quantidade de colunas",
              icon: Columns3,
            },
            {
              title: "Tipos de Trabalho",
              desc: "Crie categorias como Casamento, Corporativo, Ensaio",
              icon: FileText,
            },
            {
              title: "Modelos de E-mail",
              desc: "Configure mensagens personalizadas de entrega",
              icon: Mail,
            },
            {
              title: "Integrações",
              desc: "Conecte Google Calendar e outras ferramentas",
              icon: Zap,
            },
          ].map((setting, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-ds-xl border border-app-border bg-white p-5 shadow-ds-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-ds-xl border border-ds-border bg-ds-cream text-app-primary">
                <setting.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ds-ink">{setting.title}</p>
                <p className="mt-1 text-xs text-ds-muted">{setting.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "benefits",
    title: "Por que usar o Dony?",
    subtitle: "Benefícios reais para seu estúdio",
    icon: Heart,
    content: (
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            title: "Economize tempo",
            desc: "Menos tempo em planilhas, mais tempo criando",
            icon: Clock,
          },
          {
            title: "Profissionalismo",
            desc: "Impressione clientes com organização e comunicação clara",
            icon: Sparkles,
          },
          {
            title: "Escale seu negócio",
            desc: "Gerencie mais jobs sem perder o controle",
            icon: Target,
          },
          {
            title: "Confiabilidade",
            desc: "Nunca mais perca prazos ou informações importantes",
            icon: Shield,
          },
          {
            title: "Trabalho em equipe",
            desc: "Colabore com sua equipe em tempo real",
            icon: Users,
          },
          {
            title: "Simplicidade",
            desc: "Interface intuitiva, pensada para criativos",
            icon: Zap,
          },
        ].map((benefit, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-ds-xl border border-app-border bg-white p-5 shadow-ds-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-ds-2xl border border-app-border bg-ds-cream text-app-primary">
              <benefit.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold text-ds-ink">{benefit.title}</p>
              <p className="mt-1 text-sm text-ds-muted">{benefit.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "test-program",
    title: "Programa de Teste",
    subtitle: "Você faz parte de algo especial",
    icon: Sparkles,
    content: (
      <div className="flex flex-col gap-6">
        <div className="rounded-ds-xl border border-purple-200 bg-purple-50 p-6 shadow-ds-card">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-purple-900">
                Testadora exclusiva
              </p>
              <p className="text-sm text-purple-700">Grupo limitado de 10 fotógrafas</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-purple-200 bg-white p-4">
              <p className="text-sm font-semibold text-purple-900">📅 Duração do teste</p>
              <p className="mt-1 text-sm text-purple-700">1 mês completo de uso</p>
            </div>
            <div className="rounded-lg border border-purple-200 bg-white p-4">
              <p className="text-sm font-semibold text-purple-900">🎁 Acesso completo</p>
              <p className="mt-1 text-sm text-purple-700">
                Todas as funcionalidades Pro liberadas
              </p>
            </div>
            <div className="rounded-lg border border-purple-200 bg-white p-4">
              <p className="text-sm font-semibold text-purple-900">💬 Seu feedback importa</p>
              <p className="mt-1 text-sm text-purple-700">
                Ajude a moldar o futuro do Dony
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-ds-xl border border-app-border bg-white p-5 shadow-ds-sm">
          <p className="text-sm font-semibold text-ds-ink">O que esperamos de você:</p>
          <ul className="mt-3 space-y-2">
            {[
              "Use o Dony no seu dia a dia real",
              "Compartilhe feedbacks honestos",
              "Reporte bugs ou dificuldades",
              "Sugira melhorias e novas funcionalidades",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ds-muted">
                <span className="mt-0.5 text-app-primary">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "final",
    title: "Pronta para começar?",
    subtitle: "Vamos transformar seu fluxo de trabalho",
    icon: Target,
    content: (
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="rounded-ds-2xl border border-app-border bg-gradient-to-br from-orange-50 to-yellow-50 p-8 text-center shadow-ds-card">
          <p className="text-2xl font-bold text-ds-ink sm:text-3xl">
            Bem-vinda ao futuro da sua pós-produção
          </p>
          <p className="mt-4 text-lg text-ds-muted">
            Vamos juntas construir a melhor ferramenta para fotógrafos
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-ds-xl border border-app-border bg-white p-5 text-center shadow-ds-sm">
            <p className="text-3xl font-bold text-app-primary">1</p>
            <p className="mt-2 text-sm font-semibold text-ds-ink">Crie sua conta</p>
          </div>
          <div className="rounded-ds-xl border border-app-border bg-white p-5 text-center shadow-ds-sm">
            <p className="text-3xl font-bold text-app-primary">2</p>
            <p className="mt-2 text-sm font-semibold text-ds-ink">Configure seu fluxo</p>
          </div>
          <div className="rounded-ds-xl border border-app-border bg-white p-5 text-center shadow-ds-sm">
            <p className="text-3xl font-bold text-app-primary">3</p>
            <p className="mt-2 text-sm font-semibold text-ds-ink">Comece a usar!</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-ds-muted">
            Dúvidas? Entre em contato pelo e-mail ou WhatsApp
          </p>
          <p className="mt-2 text-sm font-semibold text-app-primary">
            donyhelp@hotmail.com
          </p>
        </div>
      </div>
    ),
  },
];

export function PresentationView() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const goToNextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const goToPrevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToNextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, toggleFullscreen, isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 flex flex-col bg-ds-cream">
      <div className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8">
        <div className="w-full max-w-5xl">
          <div className="rounded-ds-2xl border border-app-border bg-white p-6 shadow-ds-card sm:p-10 lg:p-12">
            <div className="mb-6 flex items-center gap-4 sm:mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-ds-2xl border border-app-border bg-ds-cream text-app-primary sm:h-16 sm:w-16">
                <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-black text-ds-ink sm:text-3xl lg:text-4xl">
                  {slide.title}
                </h1>
                <p className="mt-1 text-sm text-ds-muted sm:text-base">{slide.subtitle}</p>
              </div>
            </div>

            <div className="min-h-[300px] sm:min-h-[400px]">{slide.content}</div>
          </div>
        </div>
      </div>

      <div className="border-t border-app-border bg-app-sidebar p-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={goToPrevSlide}
              disabled={currentSlide === 0}
              aria-label="Slide anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={goToNextSlide}
              disabled={currentSlide === slides.length - 1}
              aria-label="Próximo slide"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ds-muted">
              {currentSlide + 1} / {slides.length}
            </span>
            <div className="hidden gap-1 sm:flex">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    i === currentSlide
                      ? "w-6 bg-app-primary"
                      : "bg-ds-border hover:bg-ds-muted"
                  )}
                  aria-label={`Ir para slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? "Sair" : "Tela cheia"} (F)
          </Button>
        </div>
      </div>

      <div className="fixed bottom-20 right-6 rounded-ds-xl border border-app-border bg-white p-3 text-xs text-ds-muted shadow-ds-sm">
        <p className="font-semibold">Atalhos:</p>
        <p className="mt-1">← → Navegar</p>
        <p>F Tela cheia</p>
        <p>ESC Sair</p>
      </div>
    </div>
  );
}
