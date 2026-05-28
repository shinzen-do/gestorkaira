import { Link } from "react-router-dom";
import { KairaLogo } from "@/components/shared/KairaLogo";
import { ArrowLeft, Check } from "lucide-react";

export default function RefundPage() {
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
        <h1 className="font-display text-2xl sm:text-3xl mb-2">Política de Reembolso</h1>
        <p className="text-xs text-muted-foreground mb-8">Última atualização: 27 de maio de 2026</p>

        <div className="glass-card p-6 mb-10 border-cobalt/30">
          <p className="text-sm">
            <strong className="text-foreground">Garantia incondicional de 7 dias:</strong> se o Kaira não
            entregar valor pra ti, devolvemos 100% do valor pago. Sem perguntas, sem burocracia.
          </p>
        </div>

        <Section title="1. Como funciona">
          <ul className="space-y-2">
            {[
              "Você tem 7 dias corridos a partir da data do pagamento para solicitar reembolso integral.",
              "Não precisa justificar. Basta enviar e-mail para contato@kaira.app com o assunto \"Reembolso\".",
              "Processamos em até 5 dias úteis. Valor é estornado pelo mesmo método de pagamento usado (cartão, PIX ou boleto).",
              "Após o reembolso, a conta é cancelada e os dados removidos em 30 dias.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-cobalt mt-0.5 flex-shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="2. Planos recorrentes (mensal/anual)">
          <p>
            Após o período de 7 dias, planos recorrentes podem ser cancelados a qualquer momento — você não
            será cobrado nos próximos ciclos, mas o valor já pago do ciclo corrente não é devolvido proporcionalmente.
          </p>
        </Section>

        <Section title="3. Plano Vitalício">
          <p>
            Mesma garantia incondicional de 7 dias. Após esse prazo, por se tratar de pagamento único com acesso
            perpétuo, não há mais reembolso. Suporte e atualizações continuam garantidos.
          </p>
        </Section>

        <Section title="4. Exceções (onde NÃO há reembolso)">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">• Solicitação após o prazo de 7 dias para planos com pagamento único.</li>
            <li className="flex items-start gap-2">• Tentativa de fraude ou violação dos Termos de Uso.</li>
            <li className="flex items-start gap-2">• Pagamentos de terceiros não autorizados (acionar a operadora do cartão).</li>
          </ul>
        </Section>

        <Section title="5. Contato">
          <p>
            Solicitar reembolso ou tirar dúvidas: <strong>contato@kaira.app</strong>
          </p>
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
