import { redirect } from "next/navigation";

export default function EstoqueEscolarRedirectPage() {
  redirect("/estoque/almoxarifado?aba=escolar");
}
