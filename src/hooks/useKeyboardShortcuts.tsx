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

const CHORD_TIMEOUT_MS = 2500;

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

export function useKeyboardShortcuts({ onOpenHelp, onCreate }: Options): Chord {
  const navigate = useNavigate();
  const [chordDisplay, setChordDisplay] = useState<Chord>(null);

  const onOpenHelpRef = useRef(onOpenHelp);
  const onCreateRef = useRef(onCreate);
  const navigateRef = useRef(navigate);
  onOpenHelpRef.current = onOpenHelp;
  onCreateRef.current = onCreate;
  navigateRef.current = navigate;

  useEffect(() => {
    const chordRef = { current: null as Chord };
    const downKeys = new Set<string>();
    let chordTimer: number | null = null;
    let displayTimer: number | null = null;

    const setChord = (c: Chord) => {
      chordRef.current = c;
      if (chordTimer) window.clearTimeout(chordTimer);
      if (displayTimer) window.clearTimeout(displayTimer);
      if (c) {
        chordTimer = window.setTimeout(() => {
          chordRef.current = null;
          setChordDisplay(null);
        }, CHORD_TIMEOUT_MS);
        setChordDisplay(c);
      } else {
        setChordDisplay(null);
      }
    };

    const clearChord = () => {
      chordRef.current = null;
      if (chordTimer) { window.clearTimeout(chordTimer); chordTimer = null; }
      setChordDisplay(null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();

      if (e.repeat) {
        downKeys.add(key);
        return;
      }

      downKeys.add(key);

      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        onOpenHelpRef.current();
        return;
      }

      const gHeld = chordRef.current === "g" || downKeys.has("g");
      const nHeld = chordRef.current === "n" || downKeys.has("n");

      if (gHeld && key !== "g" && G_MAP[key]) {
        e.preventDefault();
        navigateRef.current(G_MAP[key]);
        clearChord();
        return;
      }

      if (nHeld && key !== "n" && N_MAP[key]) {
        e.preventDefault();
        onCreateRef.current?.(N_MAP[key]);
        clearChord();
        return;
      }

      if (key === "g") { setChord("g"); return; }
      if (key === "n") { setChord("n"); return; }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      downKeys.delete(e.key.toLowerCase());
    };

    const onBlur = () => {
      downKeys.clear();
      clearChord();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      if (chordTimer) window.clearTimeout(chordTimer);
      if (displayTimer) window.clearTimeout(displayTimer);
    };
  }, []);

  return chordDisplay;
}
