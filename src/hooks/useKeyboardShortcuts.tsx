import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Chord = "g" | "n" | null;

export interface ShortcutBinding {
  combo: string;
  label: string;
  group: "Navegação" | "Criar" | "Geral";
}

export const SHORTCUTS: ShortcutBinding[] = [
  { combo: "g d", label: "Ir pro Dashboard", group: "Navegação" },
  { combo: "g c", label: "Ir pra Clientes", group: "Navegação" },
  { combo: "g a", label: "Ir pra Públicos", group: "Navegação" },
  { combo: "g k", label: "Ir pro Calendário", group: "Navegação" },
  { combo: "g t", label: "Ir pra Timeline", group: "Navegação" },
  { combo: "g p", label: "Ir pra Pacing", group: "Navegação" },
  { combo: "g r", label: "Ir pra Programação", group: "Navegação" },
  { combo: "g f", label: "Ir pra Seguidores", group: "Navegação" },
  { combo: "g s", label: "Ir pras Configurações", group: "Navegação" },
  { combo: "n c", label: "Novo cliente", group: "Criar" },
  { combo: "n p", label: "Novo público", group: "Criar" },
  { combo: "n t", label: "Nova nota no calendário", group: "Criar" },
  { combo: "⌘ K", label: "Busca global", group: "Geral" },
  { combo: "?", label: "Mostrar atalhos", group: "Geral" },
];

const G_MAP: Record<string, string> = {
  d: "/dashboard",
  c: "/clients",
  a: "/audiences",
  k: "/calendar",
  t: "/timeline",
  p: "/pacing",
  r: "/programacao",
  f: "/followers",
  s: "/settings",
};

const N_MAP: Record<string, "client" | "audience" | "calendar"> = {
  c: "client",
  p: "audience",
  t: "calendar",
};

const CHORD_TIMEOUT_MS = 2000;

function isTypingTarget(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  return false;
}

interface Options {
  onOpenHelp: () => void;
  onCreate?: (which: "client" | "audience" | "calendar") => void;
}

export function useKeyboardShortcuts({ onOpenHelp, onCreate }: Options) {
  const navigate = useNavigate();
  const chordRef = useRef<Chord>(null);
  const chordTimerRef = useRef<number | null>(null);
  const downKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const clearChord = () => {
      chordRef.current = null;
      if (chordTimerRef.current) {
        window.clearTimeout(chordTimerRef.current);
        chordTimerRef.current = null;
      }
    };

    const armChord = (c: Chord) => {
      chordRef.current = c;
      if (chordTimerRef.current) window.clearTimeout(chordTimerRef.current);
      chordTimerRef.current = window.setTimeout(clearChord, CHORD_TIMEOUT_MS);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();
      downKeysRef.current.add(key);

      if (e.repeat) return;

      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        onOpenHelp();
        return;
      }

      const gHeld = chordRef.current === "g" || downKeysRef.current.has("g");
      const nHeld = chordRef.current === "n" || downKeysRef.current.has("n");

      if (gHeld && key !== "g" && G_MAP[key]) {
        e.preventDefault();
        navigate(G_MAP[key]);
        clearChord();
        return;
      }

      if (nHeld && key !== "n" && N_MAP[key]) {
        e.preventDefault();
        onCreate?.(N_MAP[key]);
        clearChord();
        return;
      }

      if (key === "g") {
        armChord("g");
        return;
      }
      if (key === "n") {
        armChord("n");
        return;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      downKeysRef.current.delete(e.key.toLowerCase());
    };

    const onBlur = () => {
      downKeysRef.current.clear();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      if (chordTimerRef.current) window.clearTimeout(chordTimerRef.current);
    };
  }, [navigate, onOpenHelp, onCreate]);
}

export function useChordIndicator() {
  const [chord, setChord] = useState<Chord>(null);

  useEffect(() => {
    let timer: number | null = null;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === "g" || key === "n") {
        if (e.repeat) return;
        setChord(key as Chord);
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => setChord(null), CHORD_TIMEOUT_MS);
      } else if (chord) {
        setChord(null);
        if (timer) window.clearTimeout(timer);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer) window.clearTimeout(timer);
    };
  }, [chord]);

  return chord;
}
