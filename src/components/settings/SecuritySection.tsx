import { useEffect, useState } from "react";
import { ShieldCheck, Smartphone, Loader2, KeyRound, Check, Copy, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Factor {
  id: string;
  friendly_name?: string;
  factor_type: "totp" | "phone";
  status: "verified" | "unverified";
  created_at: string;
}

interface EnrollState {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export function SecuritySection() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollment, setEnrollment] = useState<EnrollState | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      toast.error("Erro ao carregar fatores", { description: error.message });
    } else {
      const all = [...(data.totp ?? []), ...(data.phone ?? [])] as Factor[];
      setFactors(all);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toLocaleDateString("pt-BR")}`,
    });
    setEnrolling(false);
    if (error) {
      toast.error("Erro ao iniciar 2FA", { description: error.message });
      return;
    }
    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
  };

  const verifyEnroll = async () => {
    if (!enrollment) return;
    if (verifyCode.replace(/\s/g, "").length < 6) {
      toast.error("Código precisa ter 6 dígitos");
      return;
    }
    setVerifying(true);
    const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({
      factorId: enrollment.factorId,
    });
    if (chalErr || !chal) {
      setVerifying(false);
      toast.error("Erro no desafio", { description: chalErr?.message });
      return;
    }
    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: chal.id,
      code: verifyCode.replace(/\s/g, ""),
    });
    setVerifying(false);
    if (verErr) {
      toast.error("Código inválido", { description: "Confere o código do app e tenta de novo." });
      return;
    }
    toast.success("2FA ativada", { description: "Sua conta agora pede código toda vez que entrar." });
    setEnrollment(null);
    setVerifyCode("");
    try {
      localStorage.setItem("kaira_security_prompted", "done");
    } catch {}
    await refresh();
  };

  const cancelEnroll = async () => {
    if (enrollment) {
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    }
    setEnrollment(null);
    setVerifyCode("");
  };

  const remove = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast.error("Erro ao remover", { description: error.message });
      return;
    }
    toast.success("Fator removido");
    await refresh();
  };

  const copySecret = () => {
    if (!enrollment) return;
    navigator.clipboard.writeText(enrollment.secret);
    toast.success("Chave copiada");
  };

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} id="security">
      <Card className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 blur-xl bg-gold/20 rounded-full" aria-hidden />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gold" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">Segurança da conta</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Autenticação de dois fatores (2FA) com app autenticador. Recomendado pra gestores que mexem com dados de cliente.
            </p>
          </div>
          {verified.length > 0 && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-health-green/10 text-health-green border border-health-green/30 flex items-center gap-1 shrink-0">
              <Check className="w-3 h-3" /> Ativa
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : verified.length === 0 ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-gold mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <p className="text-foreground font-medium">Sem 2FA ativa</p>
                <p className="text-muted-foreground mt-0.5">
                  Sua conta tá protegida só por senha/Google. Ative 2FA pra ter uma camada extra.
                </p>
              </div>
            </div>
            <Button onClick={startEnroll} disabled={enrolling} className="gap-2">
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              Configurar app autenticador
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {verified.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/20">
                <Smartphone className="w-4 h-4 text-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{f.friendly_name ?? "Authenticator"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Adicionado em {new Date(f.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <ConfirmDialog
                  title="Remover 2FA?"
                  description="Sua conta volta a ser protegida apenas por senha/Google. Você pode reativar depois."
                  confirmLabel="Remover"
                  destructive
                  onConfirm={() => remove(f.id)}
                  trigger={
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!enrollment} onOpenChange={(o) => !o && cancelEnroll()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-gold" /> Configurar autenticador
            </DialogTitle>
            <DialogDescription>
              1) Abra Google Authenticator, Authy ou 1Password no celular.<br />
              2) Escaneie o QR ou digite a chave manual.<br />
              3) Digite o código de 6 dígitos que o app gerar.
            </DialogDescription>
          </DialogHeader>

          {enrollment && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-white">
                <img src={enrollment.qrCode} alt="QR code 2FA" className="w-44 h-44" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Chave manual (se não conseguir escanear)</Label>
                <div className="flex gap-2">
                  <Input value={enrollment.secret} readOnly className="font-mono text-xs" />
                  <Button size="sm" variant="outline" onClick={copySecret}><Copy className="w-3.5 h-3.5" /></Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Código do app (6 dígitos)</Label>
                <Input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.4em] font-mono h-14"
                  onKeyDown={(e) => e.key === "Enter" && verifyCode.length === 6 && verifyEnroll()}
                  autoFocus
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={cancelEnroll} disabled={verifying}>Cancelar</Button>
            <Button onClick={verifyEnroll} disabled={verifying || verifyCode.length !== 6}>
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ativar 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
