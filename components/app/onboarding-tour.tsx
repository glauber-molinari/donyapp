"use client";

import { driver, type Config, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";

import { markTourCompleted } from "@/lib/onboarding/tour-actions";

function waitForSelector(selector: string, timeoutMs = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      resolve(true);
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => {
      if (document.querySelector(selector)) {
        window.clearInterval(id);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        window.clearInterval(id);
        resolve(false);
      }
    }, 40);
  });
}

function buildSteps(router: ReturnType<typeof useRouter>): DriveStep[] {
  return [
    // 1 — Dashboard
    {
      element: "#menu-dashboard",
      popover: {
        title: "Dashboard",
        description:
          "Visão geral de todos os jobs: filtre por status, data ou cliente e crie ou edite direto na tabela.",
        side: "right",
        align: "start",
        onNextClick: (_el, _step, { driver: d }) => {
          router.push("/contacts");
          void waitForSelector("#btn-novo-contato").then(() => {
            d.refresh();
            d.moveNext();
          });
        },
      },
    },
    // 2 — Contatos (menu)
    {
      element: "#menu-contatos",
      popover: {
        title: "Contatos",
        description:
          "Cadastre clientes aqui para vincular aos trabalhos. Nome e e-mail já bastam para começar.",
        side: "right",
        align: "start",
        onPrevClick: (_el, _step, { driver: d }) => {
          router.push("/dashboard");
          void waitForSelector("#menu-dashboard").then(() => {
            d.refresh();
            d.movePrevious();
          });
        },
      },
    },
    // 3 — Novo contato
    {
      element: "#btn-novo-contato",
      popover: {
        title: "Novo contato",
        description: "Clique aqui para adicionar um cliente. Basta o nome e o e-mail dele.",
        side: "bottom",
        align: "start",
      },
    },
    // 4 — Edições (menu)
    {
      element: "#menu-edicoes",
      popover: {
        title: "Edições",
        description: "É aqui que fica o kanban: arraste os cards conforme o trabalho avança.",
        side: "right",
        align: "start",
        onNextClick: (_el, _step, { driver: d }) => {
          router.push("/board");
          void waitForSelector("#btn-novo-job").then(() => {
            d.refresh();
            d.moveNext();
          });
        },
        onPrevClick: (_el, _step, { driver: d }) => {
          router.push("/contacts");
          void waitForSelector("#btn-novo-contato").then(() => {
            d.refresh();
            d.movePrevious();
          });
        },
      },
    },
    // 5 — Novo job
    {
      element: "#btn-novo-job",
      popover: {
        title: "Novo job",
        description: "Crie um job para cada trabalho de edição. Defina o prazo e as observações.",
        side: "bottom",
        align: "start",
      },
    },
    // 6 — Kanban board
    {
      element: "#kanban-board",
      popover: {
        title: "Kanban de Edições",
        description: "Arraste os cards entre as colunas conforme avança na edição. Clique em um card para ver detalhes ou excluir.",
        side: "top",
        align: "start",
      },
    },
    // 7 — Tarefas (menu)
    {
      element: "#menu-tarefas",
      popover: {
        title: "Tarefas (PRO)",
        description:
          "Organize tarefas internas do estúdio em um quadro Kanban com 3 colunas: Para fazer, Iniciado e Feito. Defina prioridade e prazo de cada tarefa.",
        side: "right",
        align: "start",
        onNextClick: (_el, _step, { driver: d }) => {
          router.push("/notes");
          void waitForSelector("#btn-nova-nota").then(() => {
            d.refresh();
            d.moveNext();
          });
        },
        onPrevClick: (_el, _step, { driver: d }) => {
          router.push("/board");
          void waitForSelector("#kanban-board").then(() => {
            d.refresh();
            d.movePrevious();
          });
        },
      },
    },
    // 8 — Anotações (menu)
    {
      element: "#menu-anotacoes",
      popover: {
        title: "Anotações",
        description:
          "Registre observações sobre clientes, jobs ou qualquer assunto do estúdio. Associe à nota o contato e o job correspondentes.",
        side: "right",
        align: "start",
        onPrevClick: (_el, _step, { driver: d }) => {
          router.push("/board");
          void waitForSelector("#menu-tarefas").then(() => {
            d.refresh();
            d.movePrevious();
          });
        },
      },
    },
    // 9 — Nova nota
    {
      element: "#btn-nova-nota",
      popover: {
        title: "Nova anotação",
        description: "Crie uma nota com título, texto rico e vínculos a contato ou job.",
        side: "bottom",
        align: "start",
      },
    },
    // 10 — Agenda (menu)
    {
      element: "#menu-agenda",
      popover: {
        title: "Agenda",
        description:
          "Conecte o Google Calendar do estúdio em Configurações → Agenda. Toda a equipe passa a ver os eventos diretamente aqui.",
        side: "right",
        align: "start",
        onNextClick: (_el, _step, { driver: d }) => {
          router.push("/settings/profile");
          void waitForSelector("#tour-settings-sidebar").then(() => {
            d.refresh();
            d.moveNext();
          });
        },
        onPrevClick: (_el, _step, { driver: d }) => {
          router.push("/notes");
          void waitForSelector("#btn-nova-nota").then(() => {
            d.refresh();
            d.movePrevious();
          });
        },
      },
    },
    // 11 — Link de Configurações
    {
      element: "#menu-settings",
      popover: {
        title: "Configurações",
        description:
          "Configurações da conta ficam por aqui. No próximo passo, um resumo rápido de cada seção.",
        side: "right",
        align: "start",
        onPrevClick: (_el, _step, { driver: d }) => {
          router.push("/notes");
          void waitForSelector("#menu-agenda").then(() => {
            d.refresh();
            d.movePrevious();
          });
        },
      },
    },
    // 12 — Sidebar de Configurações
    {
      element: "#tour-settings-sidebar",
      popover: {
        title: "Dentro de Configurações",
        description:
          "Perfil — ajuste seu nome e refaça este tour. Kanban — etapas do quadro e tipos de trabalho. Equipe — convide ou remova colaboradores. E-mail — templates de entrega ao cliente. Agenda — conecte o Google Calendar. Plano — veja trial e assinatura. Importar — adicione contatos em lote a partir de uma planilha .csv.",
        side: "right",
        align: "start",
      },
    },
  ];
}

function baseDriverConfig(
  steps: DriveStep[],
  persistCompletion: boolean,
  driverRef: MutableRefObject<ReturnType<typeof driver> | null>
): Config {
  return {
    showProgress: true,
    progressText: "{{current}} de {{total}}",
    nextBtnText: "Próximo",
    doneBtnText: "Concluir",
    showButtons: ["next", "previous", "close"],
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayOpacity: 0.55,
    overlayColor: "#0c0a09",
    stageRadius: 12,
    stagePadding: 8,
    popoverClass: "dony-driver-popover",
    popoverOffset: 12,
    steps,
    onDestroyed: () => {
      driverRef.current = null;
      if (persistCompletion) {
        void markTourCompleted();
      }
    },
  };
}

type OnboardingTourContextValue = {
  /** Inicia o tour sem alterar `tour_completed` no banco (útil para testes). */
  startTour: () => void;
};

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(null);

export function useOnboardingTour(): OnboardingTourContextValue | null {
  return useContext(OnboardingTourContext);
}

export interface OnboardingTourProviderProps {
  tourCompleted: boolean;
  children: ReactNode;
}

export function OnboardingTourProvider({ tourCompleted, children }: OnboardingTourProviderProps) {
  void tourCompleted;
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const mountDriver = useCallback((persistCompletion: boolean) => {
    driverRef.current?.destroy();
    const steps = buildSteps(routerRef.current);
    const d = driver(baseDriverConfig(steps, persistCompletion, driverRef));
    driverRef.current = d;
    d.drive();
  }, []);

  const startTour = useCallback(() => {
    mountDriver(true);
  }, [mountDriver]);

  const contextValue = useMemo(() => ({ startTour }), [startTour]);

  return (
    <OnboardingTourContext.Provider value={contextValue}>{children}</OnboardingTourContext.Provider>
  );
}
