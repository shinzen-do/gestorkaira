import { useEffect } from "react";

const BASE = "Kaira";
const DEFAULT = "Kaira — Central de comando para gestores de tráfego pago";

export function useDocumentTitle(section: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${section} · ${BASE}`;
    return () => {
      document.title = previous || DEFAULT;
    };
  }, [section]);
}
