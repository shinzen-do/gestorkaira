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
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import ClientsPage from "./pages/ClientsPage";
import AudiencesPage from "./pages/AudiencesPage";
import CalendarPage from "./pages/CalendarPage";
import TimelinePage from "./pages/TimelinePage";
import PacingPage from "./pages/PacingPage";
import ProgrammingPage from "./pages/ProgrammingPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>
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

                  <Route path="/dashboard" element={<Protected><HomePage /></Protected>} />
                  <Route path="/clients" element={<Protected><ClientsPage /></Protected>} />
                  <Route path="/audiences" element={<Protected><AudiencesPage /></Protected>} />
                  <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
                  <Route path="/timeline" element={<Protected><TimelinePage /></Protected>} />
                  <Route path="/pacing" element={<Protected><PacingPage /></Protected>} />
                  <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppDataProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
