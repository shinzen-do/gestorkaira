// Extrai mensagem segura de qualquer erro pego em catch.
// Use em vez de `catch (e: any)` para não quebrar lint sem perder a mensagem.
export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message: unknown }).message
    if (typeof m === "string") return m
  }
  return "Erro desconhecido"
}
