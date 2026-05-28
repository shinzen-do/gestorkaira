import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plug, Plus, Copy, Trash2, Check, Loader2, AlertTriangle, Bot, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

const MCP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kaira-mcp`;

function randomKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `kaira_${b64}`;
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function ConnectorsSection() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [revealKey, setRevealKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar chaves", { description: error.message });
    } else {
      setKeys((data ?? []) as ApiKeyRow[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async () => {
    if (!user) return;
    const name = newName.trim() || `Claude.ai (${new Date().toLocaleDateString("pt-BR")})`;
    setCreating(true);
    const token = randomKey();
    const hash = await sha256(token);
    const prefix = token.slice(0, 14);
    const { error } = await supabase.from("api_keys").insert({
      user_id: user.id,
      name,
      key_hash: hash,
      key_prefix: prefix,
    });
    setCreating(false);
    if (error) {
      toast.error("Erro ao criar chave", { description: error.message });
      return;
    }
    setRevealKey(token);
    setNewName("");
    await refresh();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast.error("Erro ao revogar", { description: error.message });
      return;
    }
    toast.success("Chave revogada");
    await refresh();
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} id="connectors">
      <Card className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 blur-xl bg-cobalt/20 rounded-full" aria-hidden />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cobalt/20 to-cobalt/5 border border-cobalt/30 flex items-center justify-center">
              <Plug className="w-5 h-5 text-cobalt" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Conectores
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cobalt/10 text-cobalt border border-cobalt/30">
                Beta
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conecte o Kaira ao Claude.ai (ou outro cliente MCP) pra criar clientes, campanhas e públicos por conversa.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-glass-border bg-surface-1/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <Bot className="w-4 h-4 text-cobalt" />
            <span className="font-medium text-foreground">URL do conector MCP</span>
          </div>
          <div className="flex gap-2">
            <Input value={MCP_URL} readOnly className="font-mono text-[11px] bg-background" />
            <Button size="sm" variant="outline" onClick={() => copy(MCP_URL, "URL")}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cole essa URL como Custom Connector no Claude.ai junto com uma chave abaixo.{" "}
            <a
              href="https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp"
              target="_blank"
              rel="noreferrer"
              className="text-cobalt hover:underline inline-flex items-center gap-1"
            >
              Como configurar <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="key-name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome da chave (opcional)</Label>
              <Input
                id="key-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Claude Pessoal"
                onKeyDown={(e) => e.key === "Enter" && create()}
              />
            </div>
            <Button onClick={create} disabled={creating} className="gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Gerar chave
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground">Nenhuma chave criada ainda.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    k.revoked_at ? "border-border bg-secondary/10 opacity-60" : "border-border bg-secondary/30"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground flex items-center gap-2">
                      {k.name}
                      {k.revoked_at && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30">
                          Revogada
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {k.key_prefix}…
                      {" · "}
                      {k.last_used_at ? `usada ${new Date(k.last_used_at).toLocaleDateString("pt-BR")}` : "nunca usada"}
                    </p>
                  </div>
                  {!k.revoked_at && (
                    <ConfirmDialog
                      title="Revogar chave?"
                      description={`A chave "${k.name}" deixa de funcionar imediatamente. Não dá pra reativar.`}
                      confirmLabel="Revogar"
                      destructive
                      onConfirm={() => revoke(k.id)}
                      trigger={
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Dialog open={!!revealKey} onOpenChange={(o) => !o && setRevealKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-4 h-4 text-health-green" /> Chave gerada
            </DialogTitle>
            <DialogDescription>
              Copie agora. Por segurança a chave completa <strong>não aparece novamente</strong>. Guarde no gerenciador de senhas.
            </DialogDescription>
          </DialogHeader>

          {revealKey && (
            <div className="space-y-3 mt-2">
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 font-mono text-xs break-all">
                {revealKey}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => copy(revealKey, "Chave")} className="flex-1 gap-2">
                  <Copy className="w-4 h-4" /> Copiar chave
                </Button>
              </div>

              <div className="rounded-lg border border-glass-border bg-surface-2/40 p-3 text-[11px] text-muted-foreground space-y-1">
                <p className="text-foreground font-medium flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                  Pra configurar no Claude.ai:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1">
                  <li>Claude.ai → Settings → <strong>Custom Connectors</strong></li>
                  <li>Add custom connector → cola URL e chave acima</li>
                  <li>Habilita no chat → fala: "Cria 5 clientes demo no Kaira"</li>
                </ol>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setRevealKey(null)}>Pronto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
