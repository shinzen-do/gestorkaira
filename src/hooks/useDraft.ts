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

export function useDialogPersist(key: string) {
  const fullKey = PREFIX + "open:" + key;
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(fullKey) === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { open ? localStorage.setItem(fullKey, "1") : localStorage.removeItem(fullKey); } catch {}
  }, [fullKey, open]);
  return [open, setOpen] as const;
}
