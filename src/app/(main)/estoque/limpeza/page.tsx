import { redirect } from "next/navigation";

export default function EstoqueLimpezaRedirectPage() {
  redirect("/estoque/almoxarifado?aba=limpeza");
}
