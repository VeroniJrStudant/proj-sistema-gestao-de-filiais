import { permanentRedirect } from "next/navigation";

/** Rota antiga «Alunos e equipe» — mantida para compatibilidade com favoritos. */
export default function PessoasRedirectPage() {
  permanentRedirect("/");
}
