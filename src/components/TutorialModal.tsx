import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

const STEPS = [
  { title: "Bem-vindo ao Kaira", body: "Esta é sua central de comando para gestão de tráfego pago. Vamos passar pelas funções principais em 1 minuto." },
  { title: "1. Clientes", body: "Comece em Clientes para cadastrar quem você gerencia. Defina o orçamento mensal — ele alimenta o Pacing e a Programação." },
  { title: "2. Campanhas, Conjuntos e Criativos", body: "Dentro de cada cliente você cria campanhas (CBO ou ABO), conjuntos e criativos. Em CBO o orçamento fica na campanha." },
  { title: "3. Públicos", body: "Cadastre públicos uma vez e ative em várias campanhas." },
  { title: "4. Pacing", body: "Defina o orçamento mensal e registre o gasto acumulado por dia. O sistema calcula projeção e te avisa se está acima ou abaixo do ritmo." },
  { title: "5. Programação", body: "Planeje campanhas futuras com início, término e orçamento. Pode também ativar uma campanha programada manualmente." },
  { title: "6. Tarefas + IA", body: "Em Tarefas você vê o que ativar/desativar hoje, lembretes e ainda pode colar mensagens para a IA gerar tarefas automaticamente." },
  { title: "7. Calendário e Seguidores", body: "Calendário guarda lembretes datados. Seguidores registra a evolução de IG/FB/TikTok por cliente." },
  { title: "8. Histórico (modo oculto)", body: "Em Configurações há a opção 'Registrar histórico de mudanças'. Deixe DESLIGADO enquanto faz o setup inicial. Quando estiver tudo pronto, ligue — daí em diante toda mudança fica registrada." },
];

export function TutorialModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("user_settings").select("tutorial_completed").eq("user_id", user.id).maybeSingle();
      if (!data?.tutorial_completed) setOpen(true);
    })();
  }, [user]);

  const finish = async () => {
    if (user) await supabase.from("user_settings").upsert({ user_id: user.id, tutorial_completed: true }, { onConflict: "user_id" });
    setOpen(false);
  };

  const s = STEPS[step];
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent className="max-w-md">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-cobalt text-xs uppercase tracking-wider"><Sparkles className="w-3.5 h-3.5" /> Tutorial · {step + 1}/{STEPS.length}</div>
          <h2 className="font-display text-xl text-foreground">{s.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={finish}>Pular</Button>
            <div className="flex gap-2">
              {step > 0 && <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>Voltar</Button>}
              {step < STEPS.length - 1
                ? <Button size="sm" onClick={() => setStep(step + 1)}>Próximo</Button>
                : <Button size="sm" onClick={finish}>Concluir</Button>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
