import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Palette, Languages, LogOut, Save, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("user_settings").select("display_name").eq("user_id", user.id).maybeSingle();
      setDisplayName(data?.display_name ?? user.user_metadata?.full_name ?? "");
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
    } catch (e: any) { toast.error("Erro ao salvar", { description: e.message }); }
    finally { setSaving(false); }
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const ThemeBtn = ({ value, label, icon: Icon }: { value: typeof theme; label: string; icon: any }) => (
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
          <div className="space-y-1.5"><Label>E-mail</Label><Input value={user?.email ?? ""} disabled /></div>
          <Button onClick={saveProfile} disabled={saving}><Save className="w-4 h-4 mr-1.5" />{saving ? "Salvando..." : t("common.save")}</Button>
        </Card>
      </motion.div>

      {/* Aparência */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-semibold text-foreground">{t("settings.appearance")}</h2>
        </div>
        <div className="flex gap-2">
          <ThemeBtn value="light" label={t("settings.theme.light")} icon={Sun} />
          <ThemeBtn value="dark" label={t("settings.theme.dark")} icon={Moon} />
          <ThemeBtn value="system" label={t("settings.theme.system")} icon={Monitor} />
        </div>
      </Card>

      {/* Idioma */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-semibold text-foreground">{t("settings.language")}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["pt", "en", "es"] as Language[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={cn("p-3 rounded-lg border text-sm font-medium transition-colors",
                lang === l ? "border-gold bg-gold/10 text-foreground" : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground")}>
              {l === "pt" ? "Português" : l === "en" ? "English" : "Español"}
            </button>
          ))}
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
