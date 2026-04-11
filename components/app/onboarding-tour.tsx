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
    {
      element: "#menu-contatos",
      popover: {
        title: "Contatos",
        description:
          "Cadastre clientes aqui para vincular aos trabalhos. Nome e e-mail já bastam para começar.",
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
    {
      element: "#btn-novo-contato",
      popover: {
        title: "Novo contato",
        description: "Clique aqui para adicionar um cliente. Basta o nome e o e-mail dele.",
        side: "bottom",
        align: "start",
      },
    },
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
    {
      element: "#btn-novo-job",
      popover: {
        title: "Novo job",
        description: "Crie um job para cada trabalho de edição. Defina o prazo e as observações.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#kanban-board",
      popover: {
        title: "Kanban",
        description: "Arraste os cards entre as colunas conforme avança na edição.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#menu-settings",
      popover: {
        title: "Abrir configurações",
        description:
          "Configurações da conta ficam por aqui. No próximo passo, um resumo rápido de cada seção.",
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
          router.push("/board");
          void waitForSelector("#kanban-board").then(() => {
            d.refresh();
            d.movePrevious();
          });
        },
      },
    },
    {
      element: "#tour-settings-sidebar",
      popover: {
        title: "Dentro de Configurações",
        description:
          "Em Perfil você ajusta o nome e pode refazer este tour. Em Kanban ficam as etapas do quadro e os tipos de trabalho ao criar jobs (só admin mexe nos tipos). Em Equipe você convida ou remove pessoas; quem é admin cuida do acesso. Em E-mail ficam as mensagens para o cliente na entrega. Em Plano você vê trial, assinatura e limites.",
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
