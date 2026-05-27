import { useEffect, useRef, useState } from "react";

const PREFIX = "kaira:draft:";

export function useDraft<T>(key: string, initial: T) {
  const fullKey = PREFIX + key;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw) return JSON.parse(raw) as T;
    } catch {}
    return initial;
  });
  const skip = useRef(false);
  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    try { localStorage.setItem(fullKey, JSON.stringify(value)); } catch {}
  }, [fullKey, value]);

  const clear = () => {
    skip.current = true;
    try { localStorage.removeItem(fullKey); } catch {}
    setValue(initial);
  };
  return [value, setValue, clear] as const;
}

// Antes persistia "open" no localStorage; isso reabria dialog após reload e em
// alguns fluxos deixava o overlay preto preso na tela após criar/salvar. Mantemos
// só estado em memória — o useDraft continua persistindo os valores do form.
export function useDialogPersist(_key: string) {
  const [open, setOpen] = useState(false);
  return [open, setOpen] as const;
}
