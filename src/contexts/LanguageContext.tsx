import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "pt" | "en" | "es";

const dict: Record<Language, Record<string, string>> = {
  pt: {
    "nav.home": "Início",
    "nav.clients": "Clientes",
    "nav.audiences": "Públicos",
    "nav.calendar": "Calendário",
    "nav.timeline": "Histórico",
    "nav.tasks": "Tarefas",
    "nav.followers": "Seguidores",
    "nav.settings": "Configurações",
    "common.add": "Adicionar",
    "common.edit": "Editar",
    "common.delete": "Excluir",
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.search": "Buscar",
    "common.empty": "Nada por aqui ainda.",
    "settings.title": "Configurações",
    "settings.profile": "Perfil",
    "settings.appearance": "Aparência",
    "settings.language": "Idioma",
    "settings.account": "Conta",
    "settings.theme.light": "Claro",
    "settings.theme.dark": "Escuro",
    "settings.theme.system": "Sistema",
    "settings.signout": "Sair",
  },
  en: {
    "nav.home": "Home",
    "nav.clients": "Clients",
    "nav.audiences": "Audiences",
    "nav.calendar": "Calendar",
    "nav.timeline": "Timeline",
    "nav.tasks": "Tasks",
    "nav.followers": "Followers",
    "nav.settings": "Settings",
    "common.add": "Add",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.search": "Search",
    "common.empty": "Nothing here yet.",
    "settings.title": "Settings",
    "settings.profile": "Profile",
    "settings.appearance": "Appearance",
    "settings.language": "Language",
    "settings.account": "Account",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",
    "settings.signout": "Sign out",
  },
  es: {
    "nav.home": "Inicio",
    "nav.clients": "Clientes",
    "nav.audiences": "Públicos",
    "nav.calendar": "Calendario",
    "nav.timeline": "Historial",
    "nav.tasks": "Tareas",
    "nav.followers": "Seguidores",
    "nav.settings": "Ajustes",
    "common.add": "Agregar",
    "common.edit": "Editar",
    "common.delete": "Eliminar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.search": "Buscar",
    "common.empty": "Aún no hay nada.",
    "settings.title": "Ajustes",
    "settings.profile": "Perfil",
    "settings.appearance": "Apariencia",
    "settings.language": "Idioma",
    "settings.account": "Cuenta",
    "settings.theme.light": "Claro",
    "settings.theme.dark": "Oscuro",
    "settings.theme.system": "Sistema",
    "settings.signout": "Cerrar sesión",
  },
};

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "kaira-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return "pt";
    return (localStorage.getItem(STORAGE_KEY) as Language) || "pt";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (k: string) => dict[lang][k] ?? dict.pt[k] ?? k;

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLangState, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
