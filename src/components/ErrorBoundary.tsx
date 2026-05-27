import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return <DefaultFallback error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="relative max-w-md w-full text-center">
        <div className="absolute inset-0 blur-3xl bg-destructive/10 rounded-full" aria-hidden />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 border border-destructive/30 mb-5">
            <AlertTriangle className="w-6 h-6 text-destructive" strokeWidth={1.5} />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-destructive mb-2">Erro inesperado</p>
          <h1 className="font-display text-3xl text-foreground mb-3 tracking-tight">
            Algo travou aqui
          </h1>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            Tentamos renderizar essa tela mas deu erro. Seus dados não foram perdidos.
          </p>
          <code className="block text-[11px] text-muted-foreground bg-secondary/40 border border-border rounded-md px-3 py-2 mb-6 font-mono text-left overflow-x-auto">
            {error.message}
          </code>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Tentar novamente
            </Button>
            <Button asChild className="gap-2">
              <a href="/dashboard">
                <Home className="w-4 h-4" /> Voltar pro dashboard
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
