import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} width={18} height={18}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.6 2.2 12 2.2 6.5 2.2 2.1 6.6 2.1 12.1S6.5 22 12 22c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.4-.2-2H12z"
      />
      <path
        fill="#34A853"
        d="M3.7 7.5l3.2 2.3C7.8 7.7 9.7 6.2 12 6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.6 2.2 12 2.2 8.2 2.2 4.9 4.3 3.7 7.5z"
        opacity="0"
      />
      <path
        fill="#4285F4"
        d="M23.3 12.4c0-.8-.1-1.4-.2-2H12v3.9h6.4c-.3 1.5-1.2 2.7-2.5 3.5l3.9 3c2.3-2.1 3.5-5.2 3.5-8.4z"
      />
      <path
        fill="#FBBC05"
        d="M6 14.3c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2L2.8 7.6C2 9 1.5 10.5 1.5 12.1c0 1.6.4 3.1 1.2 4.5L6 14.3z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.9 0 5.4-1 7.2-2.6l-3.9-3c-1 .7-2.3 1.2-3.9 1.2-3 0-5.5-2-6.4-4.8L2 15.4C3.8 19.3 7.6 22 12 22z"
      />
    </svg>
  );
}

interface Props {
  label?: string;
  className?: string;
}

export function GoogleSignInButton({ label = "Continuar com Google", className }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast({
        title: "Erro ao conectar com Google",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      className={`w-full h-11 gap-2.5 bg-surface-1/60 border-glass-border hover:bg-surface-2 hover:border-foreground/20 font-medium ${className ?? ""}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <GoogleIcon className="shrink-0" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
