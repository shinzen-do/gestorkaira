import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookiesBanner } from "@/components/CookiesBanner";

// Eager: páginas de entrada (Landing/auth) — LCP crítico
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

// Lazy: páginas legais (acessadas raramente)
const PrivacyPage = lazy(() => import("./pages/legal/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/legal/TermsPage"));
const RefundPage = lazy(() => import("./pages/legal/RefundPage"));

// Lazy: páginas internas (já autenticadas) — carrega sob demanda
const HomePage = lazy(() => import("./pages/HomePage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const AudiencesPage = lazy(() => import("./pages/AudiencesPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const TimelinePage = lazy(() => import("./pages/TimelinePage"));
const PacingPage = lazy(() => import("./pages/PacingPage"));
const ProgrammingPage = lazy(() => import("./pages/ProgrammingPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const FollowersPage = lazy(() => import("./pages/FollowersPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-6 h-6 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
  </div>
);

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>{children}</Suspense>
      </ErrorBoundary>
    </AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppDataProvider>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/privacidade" element={<Suspense fallback={null}><PrivacyPage /></Suspense>} />
                  <Route path="/termos" element={<Suspense fallback={null}><TermsPage /></Suspense>} />
                  <Route path="/reembolso" element={<Suspense fallback={null}><RefundPage /></Suspense>} />

                  <Route path="/dashboard" element={<Protected><HomePage /></Protected>} />
                  <Route path="/clients" element={<Protected><ClientsPage /></Protected>} />
                  <Route path="/audiences" element={<Protected><AudiencesPage /></Protected>} />
                  <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
                  <Route path="/timeline" element={<Protected><TimelinePage /></Protected>} />
                  <Route path="/pacing" element={<Protected><PacingPage /></Protected>} />
                  <Route path="/programacao" element={<Protected><ProgrammingPage /></Protected>} />
                  <Route path="/tasks" element={<Protected><TasksPage /></Protected>} />
                  <Route path="/followers" element={<Protected><FollowersPage /></Protected>} />
                  <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CookiesBanner />
              </AppDataProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
