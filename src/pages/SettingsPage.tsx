import { useEffect, useState } from "react";
import { errMsg } from "@/lib/errors";
import { motion } from "framer-motion";
import { User, Palette, LogOut, Save, Sun, Moon, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SecuritySection } from "@/components/settings/SecuritySection";

export default function SettingsPage() {
  useDocumentTitle("Configurações");
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [historySaving, setHistorySaving] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_settings")
        .select("display_name, history_tracking_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      setDisplayName(data?.display_name ?? user.user_metadata?.full_name ?? "");
      setHistoryEnabled(Boolean(data?.history_tracking_enabled));
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_settings").upsert(
        { user_id: user.id, display_name: displayName.trim() || null, theme, language: lang },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
      toast.success("Perfil atualizado");
    } catch (e) { toast.error("Erro ao salvar", { description: errMsg(e) }); }
    finally { setSaving(false); }
  };

  const toggleHistory = async (next: boolean) => {
    if (!user) return;
    setHistoryEnabled(next);
    setHistorySaving(true);
    const { error } = await supabase.from("user_settings").upsert(
      { user_id: user.id, history_tracking_enabled: next },
      { onConflict: "user_id" },
    );
    setHistorySaving(false);
    if (error) {
      setHistoryEnabled(!next);
      toast.error("Erro ao alterar Modo Histórico", { description: error.message });
    } else {
      toast.success(next ? "Modo Histórico ativado" : "Modo Histórico desativado");
    }
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const ThemeBtn = ({ value, label, icon: Icon }: { value: typeof theme; label: string; icon: React.ComponentType<{ className?: string }> }) => (
    <button onClick={() => setTheme(value)}
      className={cn("flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors",
        theme === value ? "border-gold bg-gold/10 text-foreground" : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border")}>
      <Icon className="w-4 h-4" /><span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalize seu perfil e a experiência da plataforma.</p>
      </div>

      {/* Perfil */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-semibold text-foreground">{t("settings.profile")}</h2>
          </div>
          <div className="space-y-1.5"><Label>Nome de exibição</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" /></div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled />
            <p className="text-[11px] text-muted-foreground">Trocar de email requer verificação. Pra mudar, fala com o suporte.</p>
          </div>
          <Button onClick={saveProfile} disabled={saving}><Save className="w-4 h-4 mr-1.5" />{saving ? "Salvando..." : t("common.save")}</Button>
        </Card>
      </motion.div>

      <SecuritySection />

      {/* Aparência */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-semibold text-foreground">{t("settings.appearance")}</h2>
        </div>
        <div className="flex gap-2">
          <ThemeBtn value="light" label={t("settings.theme.light")} icon={Sun} />
          <ThemeBtn value="dark" label={t("settings.theme.dark")} icon={Moon} />
        </div>
      </Card>

      {/* Modo Histórico */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-semibold text-foreground">Modo Histórico</h2>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-foreground">Registrar mudanças automaticamente</p>
            <p className="text-xs text-muted-foreground">
              Quando ligado, toda alteração em cliente, campanha, conjunto e público gera entrada no Histórico.
              Deixe desligado durante o setup inicial — ligue quando o cenário estiver pronto.
            </p>
          </div>
          <Switch checked={historyEnabled} onCheckedChange={toggleHistory} disabled={historySaving} />
        </div>
      </Card>

      {/* Conta */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <LogOut className="w-4 h-4 text-destructive" />
          <h2 className="text-sm font-semibold text-foreground">{t("settings.account")}</h2>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
          <LogOut className="w-4 h-4 mr-1.5" />{t("settings.signout")}
        </Button>
      </Card>
    </div>
  );
}
