import { Home, Users, History, Settings, Calendar, Target, Activity, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { KairaLogo } from "./shared/KairaLogo";
import { useLanguage } from "@/contexts/LanguageContext";

export function KairaSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { t } = useLanguage();

  const navItems = [
    { title: t("nav.home"), url: "/dashboard", icon: Home },
    { title: t("nav.clients"), url: "/clients", icon: Users },
    { title: t("nav.audiences"), url: "/audiences", icon: Target },
    { title: "Programação", url: "/programacao", icon: Sparkles },
    { title: "Pacing", url: "/pacing", icon: Activity },
    { title: t("nav.calendar"), url: "/calendar", icon: Calendar },
    { title: t("nav.timeline"), url: "/timeline", icon: History },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Detalhe neon azul: linha fina vertical no lado esquerdo */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cobalt-glow to-transparent opacity-70 shadow-[0_0_8px_hsl(var(--cobalt-glow)/0.6)]" />

      <SidebarHeader className="p-4">
        <KairaLogo size={28} withText={!collapsed} />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      activeClassName="text-foreground bg-secondary border-l-2 border-cobalt-glow shadow-[inset_2px_0_8px_-4px_hsl(var(--cobalt-glow)/0.6)]">
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
                activeClassName="text-foreground bg-secondary">
                <Settings className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{t("nav.settings")}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
