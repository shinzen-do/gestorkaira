import { useState } from "react";
import { ChevronDown, BookOpen, MessageSquare, AlertCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Passo a passo de ativação do conector no Claude.ai. Vive aqui dentro do app
// (na tela de Conectores) pra reduzir fricção de onboarding sem hosting extra.

const STEPS = [
  <>No Claude.ai, abra <strong>Settings → Connectors</strong> (Configurações → Conectores).</>,
  <>Clique em <strong>Add custom connector</strong> (Adicionar conector personalizado).</>,
  <>Cole a <strong>URL do conector</strong> (o campo acima). Deixe o campo de chave/token <strong>vazio</strong>.</>,
  <>Confirme. O Claude abre uma janela do Kaira pedindo autorização.</>,
  <>Se pedir, faça login no Kaira e clique em <strong>Autorizar</strong>.</>,
  <>Pronto. Volte ao chat e teste — ex: <em>"Resuma minha conta no Kaira"</em>.</>,
];

const PROMPTS = [
  "Resuma minha conta no Kaira",
  "Liste meus clientes e o gasto de cada um",
  "Crie uma tarefa: revisar criativos amanhã, prioridade alta",
  "Pause a campanha de maior gasto",
];

const TROUBLESHOOT = [
  <>
    <strong>Não vejo "Add custom connector".</strong> Conectores personalizados exigem
    plano pago do Claude (Pro, Max, Team ou Enterprise) — não estão no plano grátis.
  </>,
  <>
    <strong>O botão Autorizar deu erro.</strong> Atualize a página e tente de novo. Se
    persistir, saia e entre de novo no Kaira antes de autorizar.
  </>,
  <>
    <strong>Conectou mas não aparecem ferramentas.</strong> No chat, desligue e religue o
    conector no menu de ferramentas, ou recarregue o Claude.ai.
  </>,
];

export function ConnectorGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-glass-border bg-surface-1/30 overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-surface-2/30 transition-colors">
          <BookOpen className="w-4 h-4 text-gold shrink-0" />
          <span className="text-xs font-medium text-foreground flex-1">
            Como conectar no Claude.ai — passo a passo
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 space-y-4">
            {/* Passos */}
            <ol className="space-y-2">
              {STEPS.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-cobalt/15 border border-cobalt/30 text-cobalt text-[9px] flex items-center justify-center font-medium mt-px">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90">{step}</span>
                </li>
              ))}
            </ol>

            {/* Primeiras frases */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-cobalt" /> Teste com estas frases
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PROMPTS.map((p) => (
                  <span
                    key={p}
                    className="text-[11px] text-foreground/80 bg-surface-2/40 border border-border rounded-full px-2.5 py-1"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-gold" /> Se travar
              </p>
              <ul className="space-y-1.5">
                {TROUBLESHOOT.map((t, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground leading-relaxed pl-1">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
