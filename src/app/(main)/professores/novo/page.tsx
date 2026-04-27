import { redirect } from "next/navigation";

type LegacySearch = {
  ok?: string;
  professor?: string;
  cadastro?: string;
  [key: string]: string | string[] | undefined;
};

/** Redireciona URLs antigas `/professores/novo` para `/funcionarios/novo`. */
export default async function ProfessoresParaFuncionariosRedirect({
  searchParams,
}: {
  searchParams: Promise<LegacySearch>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [key, raw] of Object.entries(sp)) {
    if (raw === undefined) continue;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined) continue;
    if (key === "professor") {
      q.set("funcionario", value);
    } else {
      q.set(key, value);
    }
  }
  const suffix = q.toString();
  redirect(suffix ? `/funcionarios/novo?${suffix}` : "/funcionarios/novo");
}
