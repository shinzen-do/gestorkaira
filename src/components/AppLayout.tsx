import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { KairaSidebar } from "./KairaSidebar";
import { GlobalSearch } from "./GlobalSearch";
import { ShortcutsModal } from "./ShortcutsModal";
import { SecurityPromptModal } from "./SecurityPromptModal";
import { ClientDialog } from "./dialogs/ClientDialog";
import { AudienceDialog } from "./dialogs/AudienceDialog";
import { useKeyboardShortcuts, useChordIndicator } from "@/hooks/useKeyboardShortcuts";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newAudienceOpen, setNewAudienceOpen] = useState(false);
  const navigate = useNavigate();
  const chord = useChordIndicator();

  const handleCreate = useCallback(
    (which: "client" | "audience" | "calendar") => {
      if (which === "client") setNewClientOpen(true);
      else if (which === "audience") setNewAudienceOpen(true);
      else if (which === "calendar") navigate("/calendar");
    },
    [navigate],
  );

  useKeyboardShortcuts({
    onOpenHelp: () => setHelpOpen(true),
    onCreate: handleCreate,
  });

  useEffect(() => {
    const prefetch = () => {
      import("@/pages/HomePage");
      import("@/pages/ClientsPage");
      import("@/pages/AudiencesPage");
      import("@/pages/CalendarPage");
      import("@/pages/TimelinePage");
      import("@/pages/PacingPage");
      import("@/pages/ProgrammingPage");
      import("@/pages/TasksPage");
      import("@/pages/FollowersPage");
      import("@/pages/SettingsPage");
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(prefetch);
    else window.setTimeout(prefetch, 800);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <KairaSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-4 border-b border-border px-4 glass-panel shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <GlobalSearch />
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>

      <ShortcutsModal open={helpOpen} onOpenChange={setHelpOpen} />
      <SecurityPromptModal />
      <ClientDialog open={newClientOpen} onOpenChange={setNewClientOpen} />
      <AudienceDialog open={newAudienceOpen} onOpenChange={setNewAudienceOpen} />

      <AnimatePresence>
        {chord && (
          <motion.div
            key={chord}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-full px-4 py-2 border-gold-soft flex items-center gap-2 text-xs"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono text-foreground">
              {chord}
            </kbd>
            <span className="text-muted-foreground">
              {chord === "g" ? "ir pra…" : "novo…"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarProvider>
  );
}
