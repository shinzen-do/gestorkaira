import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureUtm, initMetaPixel } from "./lib/tracking";

// Limpa estados de dialog abertos persistidos antes da remoção do useDialogPersist.
// Pode tirar este bloco depois que tu confirmar que está tudo OK (após 2026-06-10).
try {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("kaira:draft:open:")) localStorage.removeItem(key);
  }
} catch {}

// Captura UTMs (first-touch) e inicializa Meta Pixel se configurado.
captureUtm();
initMetaPixel();

createRoot(document.getElementById("root")!).render(<App />);
