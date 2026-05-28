import { Link } from "react-router-dom";
import { KairaLogo } from "@/components/shared/KairaLogo";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 h-14">
          <Link to="/" className="flex items-center gap-2">
            <KairaLogo size={24} />
            <span className="font-semibold tracking-tight">Kaira</span>
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-invert">
        <h1 className="font-display text-2xl sm:text-3xl mb-2">Política de Privacidade</h1>
        <p className="text-xs text-muted-foreground mb-8">Última atualização: 27 de maio de 2026</p>

        <Section title="1. Quem somos">
          O Kaira é uma plataforma para gestores de tráfego pago organizarem clientes, campanhas e métricas.
          Esta política descreve como coletamos, usamos e protegemos seus dados.
        </Section>

        <Section title="2. Dados que coletamos">
          <ul>
            <li><strong>Cadastro:</strong> nome, e-mail, senha (armazenada com criptografia forte).</li>
            <li><strong>Uso da plataforma:</strong> clientes cadastrados, campanhas, métricas, tarefas, criativos e demais dados que você insere.</li>
            <li><strong>Pagamento:</strong> processado pela Cakto. Não armazenamos dados de cartão.</li>
            <li><strong>Técnicos:</strong> logs anônimos de acesso para diagnóstico e segurança.</li>
          </ul>
        </Section>

        <Section title="3. Como usamos">
          Seus dados são usados exclusivamente para prover o serviço contratado. Não vendemos nem compartilhamos
          com terceiros para fins de marketing. Eventuais subprocessadores (Supabase para banco de dados, Resend
          para e-mails transacionais, Cakto para pagamentos, Vercel para hospedagem) operam sob acordos de
          confidencialidade.
        </Section>

        <Section title="4. Direitos do titular (LGPD)">
          Você pode, a qualquer momento, solicitar acesso, correção, portabilidade ou exclusão dos seus dados.
          Basta enviar e-mail para <strong>contato@kaira.app</strong>. Atendemos em até 15 dias úteis.
        </Section>

        <Section title="5. Cookies">
          Usamos cookies essenciais para manter sua sessão autenticada. Cookies de análise são opcionais e podem
          ser desativados a qualquer momento no banner exibido no primeiro acesso.
        </Section>

        <Section title="6. Segurança">
          Comunicação em HTTPS (TLS). Banco com isolamento por linha (RLS) — cada usuário só acessa os próprios
          dados. Backups regulares. Senhas armazenadas com hash bcrypt.
        </Section>

        <Section title="7. Retenção">
          Mantemos seus dados enquanto a conta estiver ativa e por até 90 dias após o cancelamento, para fins
          legais e de eventual reativação. Exclusão definitiva pode ser solicitada a qualquer momento.
        </Section>

        <Section title="8. Contato">
          Dúvidas sobre privacidade: <strong>contato@kaira.app</strong>.
        </Section>
      </main>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border mt-16 py-6 px-6 text-xs text-muted-foreground">
      <div className="max-w-3xl mx-auto flex flex-wrap gap-4">
        <Link to="/privacidade" className="hover:text-foreground">Privacidade</Link>
        <Link to="/termos" className="hover:text-foreground">Termos</Link>
        <Link to="/reembolso" className="hover:text-foreground">Reembolso</Link>
        <span className="ml-auto">© {new Date().getFullYear()} Kaira</span>
      </div>
    </footer>
  );
}
