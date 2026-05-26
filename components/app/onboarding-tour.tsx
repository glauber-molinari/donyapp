"use client";

import { driver, type Config, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
        description: "Clique para cadastrar um cliente. Preencha nome e e-mail — o restante é opcional.",
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
        description: "Cadastre um job para cada sessão de fotos ou vídeo. Informe nome, cliente, prazo e tipo de entrega.",
        side: "bottom",
        align: "start",
      },
    },
    // 6 — Kanban board
    {
      element: "#kanban-board",
      popover: {
        title: "Kanban de Edições",
        description: "Arraste os cards entre colunas à medida que a edição avança. Clique em qualquer card para ver detalhes, editar ou excluir.",
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
          "Aqui ficam todas as configurações da conta. Clique para conhecer cada seção no próximo passo.",
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
        title: "O que tem em Configurações",
        description:
          "Perfil — nome e refazer o tour. Kanban — etapas e tipos de trabalho. Equipe — convide colaboradores. E-mail — templates de entrega. Agenda — Google Calendar. Plano — trial e assinatura. Importar — contatos em lote via .csv.",
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
    nextBtnText: "Próximo →",
    prevBtnText: "← Anterior",
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

  // Auto-start para novos usuários que ainda não viram o tour.
  useEffect(() => {
    if (!tourCompleted) {
      mountDriver(true);
    }
    // Só deve rodar na montagem do shell — dependências intencionalmente vazias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTour = useCallback(() => {
    mountDriver(true);
  }, [mountDriver]);

  const contextValue = useMemo(() => ({ startTour }), [startTour]);

  return (
    <OnboardingTourContext.Provider value={contextValue}>{children}</OnboardingTourContext.Provider>
  );
}
