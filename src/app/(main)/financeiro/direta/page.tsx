import { redirect } from "next/navigation";

/** Mantido por compatibilidade de links antigos; fluxo unificado em Pagamentos para famílias. */
export default function DiretaRedirectPage() {
  redirect("/financeiro/entradas/pagamentos-pais");
}
