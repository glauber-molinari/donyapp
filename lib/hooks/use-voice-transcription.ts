"use client";

import { useEffect, useRef, useState } from "react";

// Declarações mínimas da Web Speech API (não incluídas em todas as versões do TS/DOM lib)
interface SrAlternative {
  transcript: string;
  confidence: number;
}
interface SrResult {
  isFinal: boolean;
  length: number;
  [index: number]: SrAlternative;
}
interface SrResultList {
  length: number;
  [index: number]: SrResult;
}
interface SrEvent extends Event {
  resultIndex: number;
  results: SrResultList;
}
interface SrErrorEvent extends Event {
  error: string;
}
interface SrInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SrEvent) => void) | null;
  onerror: ((event: SrErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface SrConstructor {
  new (): SrInstance;
}

interface UseVoiceTranscriptionReturn {
  isSupported: boolean;
  isRecording: boolean;
  interimText: string;
  errorMessage: string | null;
  start: (onFinalText: (text: string) => void) => void;
  stop: () => void;
}

function getAPI(): SrConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitSpeechRecognition?: SrConstructor; SpeechRecognition?: SrConstructor };
  return w.webkitSpeechRecognition ?? w.SpeechRecognition ?? null;
}

export function useVoiceTranscription(): UseVoiceTranscriptionReturn {
  const isSupported = typeof window !== "undefined" && getAPI() !== null;

  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wantRecordingRef = useRef(false);
  const onFinalTextRef = useRef<((text: string) => void) | null>(null);
  const recognitionRef = useRef<SrInstance | null>(null);

  // Not a useCallback — avoids stale closure issues in the recursive onend chain
  function createAndStart() {
    const API = getAPI();
    if (!API || !wantRecordingRef.current) return;

    const r = new API();
    r.lang = "pt-BR";
    // continuous: false is more reliable on Chrome/Windows.
    // We restart manually via onend when the user still wants to record.
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setIsRecording(true);
    };

    r.onresult = (event: SrEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          onFinalTextRef.current?.(result[0].transcript);
          setInterimText("");
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) setInterimText(interim);
    };

    r.onerror = (event: SrErrorEvent) => {
      // no-speech = silêncio detectado, não é fatal — onend vai reiniciar
      if (event.error === "no-speech") return;

      wantRecordingRef.current = false;
      setIsRecording(false);
      setInterimText("");

      if (event.error === "not-allowed") {
        setErrorMessage(
          "Permissão de microfone negada. Clique no ícone ⓘ (ou 🔒) à esquerda do endereço no navegador → Microfone → Permitir, depois recarregue a página.",
        );
      } else if (event.error === "audio-capture") {
        setErrorMessage(
          "Nenhum microfone encontrado. Verifique se um microfone está conectado.",
        );
      } else {
        setErrorMessage(`Erro ao gravar: ${event.error}`);
      }
    };

    r.onend = () => {
      setInterimText("");
      if (wantRecordingRef.current) {
        // Cria nova instância — reutilizar o objeto encerrado é instável
        createAndStart();
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = r;
    r.start();
  }

  function start(onFinalText: (text: string) => void) {
    if (!isSupported) return;
    setErrorMessage(null);
    onFinalTextRef.current = onFinalText;
    wantRecordingRef.current = true;
    createAndStart();
  }

  function stop() {
    wantRecordingRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
    setInterimText("");
  }

  useEffect(() => {
    return () => {
      wantRecordingRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  return { isSupported, isRecording, interimText, errorMessage, start, stop };
}
