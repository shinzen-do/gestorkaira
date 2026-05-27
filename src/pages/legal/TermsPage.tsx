import { Link } from "react-router-dom";
import { KairaLogo } from "@/components/shared/KairaLogo";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl mb-2">Termos de Uso</h1>
        <p className="text-xs text-muted-foreground mb-8">Última atualização: 27 de maio de 2026</p>

        <Section title="1. Aceitação">
          Ao criar uma conta, você concorda com estes termos. Se discorda, não use o serviço.
        </Section>

        <Section title="2. O serviço">
          Kaira é uma plataforma SaaS que ajuda gestores de tráfego pago a organizar clientes, campanhas,
          criativos e métricas. Não substitui as plataformas de mídia (Meta Ads, Google Ads etc.); apenas
          centraliza a operação.
        </Section>

        <Section title="3. Conta e segurança">
          <ul>
            <li>Você é responsável pela confidencialidade da sua senha.</li>
            <li>Avise-nos imediatamente em caso de acesso não autorizado.</li>
            <li>Idade mínima: 16 anos.</li>
          </ul>
        </Section>

        <Section title="4. Planos e pagamentos">
          <ul>
            <li>Plano Free: 1 cliente ativo. Sem prazo.</li>
            <li>Pro Mensal R$ 47/mês, Pro Anual R$ 470/ano, Vitalício R$ 497 pagamento único.</li>
            <li>Pagamentos via Cakto. Aceitamos cartão, PIX e boleto conforme disponibilidade.</li>
            <li>Renovação automática nos planos recorrentes. Cancele a qualquer momento.</li>
            <li>Sem fidelidade nos planos mensais e anuais. Vitalício é compra única, sem reembolso após 7 dias.</li>
          </ul>
        </Section>

        <Section title="5. Uso aceitável">
          Não é permitido:
          <ul>
            <li>Tentar acessar dados de outros usuários.</li>
            <li>Fazer scraping ou engenharia reversa do serviço.</li>
            <li>Usar para finalidade ilegal ou que viole políticas das plataformas de mídia.</li>
            <li>Revender acesso sem autorização explícita.</li>
          </ul>
        </Section>

        <Section title="6. Propriedade intelectual">
          O software, marca, design e conteúdo do Kaira são de propriedade nossa. Seus dados (clientes,
          campanhas, métricas) são e sempre serão seus — exportáveis e excluíveis a qualquer momento.
        </Section>

        <Section title="7. Limitação de responsabilidade">
          O Kaira é fornecido "no estado em que se encontra". Não nos responsabilizamos por perdas indiretas
          decorrentes do uso ou indisponibilidade temporária do serviço. Manteremos SLA de 99% de uptime como objetivo.
        </Section>

        <Section title="8. Cancelamento e exclusão">
          Você pode cancelar e excluir a conta a qualquer momento em Configurações → Conta. Após exclusão,
          dados são retidos por 90 dias para eventual reativação e depois removidos definitivamente.
        </Section>

        <Section title="9. Alterações nos termos">
          Podemos atualizar estes termos. Mudanças relevantes serão comunicadas por e-mail e na plataforma
          com pelo menos 15 dias de antecedência.
        </Section>

        <Section title="10. Foro">
          Foro da comarca do contratante para questões relativas a estes termos.
        </Section>

        <Section title="11. Contato">
          <strong>contato@kaira.app</strong>
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
