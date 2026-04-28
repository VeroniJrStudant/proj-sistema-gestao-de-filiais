import { redirect } from "next/navigation";

export default function EstoqueZeladoriaRedirectPage() {
  redirect("/estoque/almoxarifado?aba=zeladoria");
}
