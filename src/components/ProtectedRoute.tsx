import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { KairaK } from "@/components/shared/KairaK";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <KairaK className="w-8 h-8 text-cobalt animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
