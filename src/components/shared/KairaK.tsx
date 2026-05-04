import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: number;
}

/**
 * Marca "K" da Kaira — usa o mesmo desenho da logo (sem o fundo de raio).
 * Substitui o ícone genérico de raio (Zap) que parecia "AI demais".
 */
export function KairaK({ className, size }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block", className)}
      aria-hidden="true"
    >
      {/* Haste vertical do K */}
      <path d="M6 3 V21" />
      {/* Diagonal superior */}
      <path d="M6 12 L17 3" />
      {/* Diagonal inferior */}
      <path d="M6 12 L18 21" />
    </svg>
  );
}
