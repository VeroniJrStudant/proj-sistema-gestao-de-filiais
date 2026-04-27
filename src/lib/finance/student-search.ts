export type FinanceGuardianLine = {
  name: string;
  relation: string | null;
  phone: string | null;
  email: string | null;
  /** CPF/CNPJ ou outro documento cadastrado no responsável. */
  document: string | null;
};

/** Fornecedor — busca e preenchimento de pagador / referência. */
export type FinanceSupplierSearchRow = {
  id: string;
  supplierCode: string | null;
  name: string;
  tradeName: string | null;
  document: string | null;
  phone?: string | null;
  email?: string | null;
};

/** Funcionário(a) — busca por nome, apelido, matrícula interna, documento, e-mail. */
export type FinanceEmployeeSearchRow = {
  id: string;
  name: string;
  nickname: string | null;
  employeeCode: string | null;
  phone: string | null;
  email: string | null;
  document: string | null;
  jobRole: string | null;
};

/** Linha de aluno para busca (PIX impresso, recebimento de mensalidades, etc.). */
export type FinanceStudentSearchRow = {
  id: string;
  name: string;
  matricula: string | null;
  active: boolean;
  shiftId: string | null;
  shiftName: string | null;
  classRoomId: string | null;
  classRoomLabel: string | null;
  teacherName: string | null;
  /** Código interno do funcionário (turma), quando casado com `Teacher`. */
  teacherEmployeeCode: string | null;
  guardians: FinanceGuardianLine[];
  /** Valor base da mensalidade (centavos), quando cadastrado no aluno. */
  tuitionMonthlyAmountCents: number | null;
};

export type FinanceShiftOption = { id: string; name: string };
export type FinanceClassRoomOption = { id: string; name: string; shiftId: string; room: string | null };

export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** Cruza nome do professor na turma com o cadastro de funcionários para obter matrícula/código. */
export function resolveTeacherEmployeeCode(
  teacherName: string | null | undefined,
  teachers: readonly { name: string; employeeCode: string | null }[],
): string | null {
  if (!teacherName?.trim()) return null;
  const target = normalizeSearch(teacherName.trim());
  for (const t of teachers) {
    const tn = normalizeSearch(t.name.trim());
    if (tn === target || tn.includes(target) || target.includes(tn)) {
      return t.employeeCode?.trim() ?? null;
    }
  }
  return null;
}

function appendRelationSearchTokens(relationNorm: string, parts: string[]): void {
  parts.push(relationNorm);
  if (relationNorm.includes("pai") || relationNorm.includes("padre") || relationNorm.includes("paterno")) {
    parts.push("pai", "padre", "genitor", "paterno", "father");
  }
  if (
    relationNorm.includes("mae") ||
    relationNorm.includes("mãe") ||
    relationNorm.includes("materno") ||
    relationNorm.includes("genitora")
  ) {
    parts.push("mae", "genitora", "materno", "mother");
  }
  if (relationNorm.includes("respons") || relationNorm.includes("tutor")) {
    parts.push("responsavel", "responsavel legal", "responsavel", "tutor", "guardiao");
  }
}

/** Texto agregado para busca por palavras (pai, mãe, professor, matrícula textual, etc.). */
export function buildStudentSearchBlob(row: FinanceStudentSearchRow): string {
  const parts: string[] = [
    row.name,
    row.matricula ?? "",
    row.teacherName ?? "",
    row.teacherEmployeeCode ?? "",
    row.classRoomLabel ?? "",
    row.shiftName ?? "",
  ];
  if (row.teacherName?.trim() || row.teacherEmployeeCode?.trim()) {
    parts.push(
      "funcionario",
      "professor",
      "professora",
      "prof",
      "docente",
      "colaborador",
      "equipe",
      "staff",
    );
  }
  for (const g of row.guardians) {
    parts.push(g.name);
    const rel = g.relation?.trim() ?? "";
    if (rel) {
      appendRelationSearchTokens(normalizeSearch(rel), parts);
    }
    parts.push(g.email ?? "");
    if (g.phone) {
      parts.push(g.phone, digitsOnly(g.phone));
    }
    if (g.document) {
      parts.push(g.document, digitsOnly(g.document));
    }
  }
  return parts.join(" ");
}

/**
 * Texto para filtrar alunos por aluno, responsáveis, turma, turno — sem professor/código da turma
 * (professor e matrícula funcional ficam na lista de funcionários).
 */
export function buildStudentGuardianSearchBlob(row: FinanceStudentSearchRow): string {
  const parts: string[] = [
    row.name,
    row.matricula ?? "",
    row.classRoomLabel ?? "",
    row.shiftName ?? "",
  ];
  for (const g of row.guardians) {
    parts.push(g.name);
    const rel = g.relation?.trim() ?? "";
    if (rel) {
      appendRelationSearchTokens(normalizeSearch(rel), parts);
    }
    parts.push(g.email ?? "");
    if (g.phone) {
      parts.push(g.phone, digitsOnly(g.phone));
    }
    if (g.document) {
      parts.push(g.document, digitsOnly(g.document));
    }
  }
  return parts.join(" ");
}

export function rowMatchesSearchQuery(row: FinanceStudentSearchRow, q: string): boolean {
  const raw = q.trim();
  if (!raw) return true;

  const hay = normalizeSearch(buildStudentGuardianSearchBlob(row));
  const nq = normalizeSearch(raw);
  if (!nq) return true;

  const tokens = nq.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    if (tokens.every((t) => hay.includes(t))) {
      return true;
    }
  } else if (tokens.length === 1 && hay.includes(tokens[0]!)) {
    return true;
  }

  if (nq.length >= 2 && hay.includes(nq)) {
    return true;
  }

  const qDigits = digitsOnly(raw);
  if (qDigits.length >= 2) {
    const digitParts: string[] = [];
    if (row.matricula) digitParts.push(digitsOnly(row.matricula));
    for (const g of row.guardians) {
      if (g.phone) digitParts.push(digitsOnly(g.phone));
      if (g.document) digitParts.push(digitsOnly(g.document));
    }
    if (digitParts.some((p) => p.includes(qDigits))) {
      return true;
    }
  }

  return false;
}

function buildEmployeeSearchBlob(e: FinanceEmployeeSearchRow): string {
  const parts: string[] = [
    e.name,
    e.nickname ?? "",
    e.employeeCode ?? "",
    e.jobRole ?? "",
    e.email ?? "",
    e.phone ?? "",
    e.document ?? "",
  ];
  if (e.phone) parts.push(digitsOnly(e.phone));
  if (e.document) parts.push(digitsOnly(e.document));
  if (e.employeeCode) parts.push(digitsOnly(e.employeeCode));
  parts.push(
    "funcionario",
    "funcionário",
    "professor",
    "professora",
    "prof",
    "docente",
    "colaborador",
    "equipe",
    "staff",
    "matricula funcional",
    "matr func",
  );
  return parts.join(" ");
}

export function employeeMatchesSearchQuery(e: FinanceEmployeeSearchRow, q: string): boolean {
  const raw = q.trim();
  if (!raw) return false;
  const hay = normalizeSearch(buildEmployeeSearchBlob(e));
  const nq = normalizeSearch(raw);
  if (!nq) return false;

  const tokens = nq.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    if (tokens.every((t) => hay.includes(t))) {
      return true;
    }
  } else if (tokens.length === 1 && hay.includes(tokens[0]!)) {
    return true;
  }

  if (nq.length >= 2 && hay.includes(nq)) {
    return true;
  }

  const qDigits = digitsOnly(raw);
  if (qDigits.length >= 2) {
    const digitParts: string[] = [];
    if (e.employeeCode) digitParts.push(digitsOnly(e.employeeCode));
    if (e.phone) digitParts.push(digitsOnly(e.phone));
    if (e.document) digitParts.push(digitsOnly(e.document));
    if (digitParts.some((p) => p.includes(qDigits))) {
      return true;
    }
  }

  return false;
}

export function supplierMatchesSearchQuery(s: FinanceSupplierSearchRow, q: string): boolean {
  const raw = q.trim();
  if (!raw) return false;
  const n = normalizeSearch(raw);
  const qDigits = digitsOnly(raw);
  const fields = [
    s.name,
    s.tradeName ?? "",
    s.supplierCode ?? "",
    s.document ?? "",
    s.email ?? "",
    s.phone ?? "",
  ];
  if (fields.some((f) => normalizeSearch(f).includes(n))) {
    return true;
  }
  if (qDigits.length >= 2 && s.supplierCode && digitsOnly(s.supplierCode).includes(qDigits)) {
    return true;
  }
  if (qDigits.length >= 2 && s.document && digitsOnly(s.document).includes(qDigits)) {
    return true;
  }
  if (qDigits.length >= 2 && s.phone && digitsOnly(s.phone).includes(qDigits)) {
    return true;
  }
  return false;
}

export function pickPayerName(row: FinanceStudentSearchRow): string {
  if (row.guardians.length === 0) {
    return row.name.trim();
  }
  const scored = row.guardians.map((g, i) => {
    const r = normalizeSearch(g.relation ?? "");
    let score = 10 + i;
    if (r.includes("mae") || r.includes("mãe") || r.includes("pai") || r.includes("respons")) {
      score = 0 + i;
    } else if (r.includes("avo") || r.includes("avô") || r.includes("tio")) {
      score = 5 + i;
    }
    return { g, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0]!.g.name.trim();
}

function guardianMatchScore(g: FinanceGuardianLine, q: string): number {
  const raw = q.trim();
  if (!raw) return 0;
  const nq = normalizeSearch(raw);
  const tokens = nq.split(/\s+/).filter(Boolean);
  const gn = normalizeSearch(g.name);
  const gr = normalizeSearch(g.relation ?? "");
  let s = 0;
  if (tokens.length > 0 && tokens.every((t) => gn.includes(t) || gr.includes(t))) {
    s += 100;
  }
  if (nq.length >= 2 && gn.includes(nq)) {
    s += 50;
  }
  if (nq.length >= 2 && (gn.includes(nq) || gr.includes(nq))) {
    s += 40;
  }
  const qd = digitsOnly(raw);
  if (qd.length >= 2) {
    if (g.phone && digitsOnly(g.phone).includes(qd)) {
      s += 90;
    }
    if (g.document && digitsOnly(g.document).includes(qd)) {
      s += 90;
    }
  }
  return s;
}

function studentNameMatchScore(row: FinanceStudentSearchRow, q: string): number {
  const nq = normalizeSearch(q.trim());
  if (!nq) return 0;
  const sn = normalizeSearch(row.name);
  const tokens = nq.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => sn.includes(t))) {
    return 80;
  }
  if (tokens.length === 1 && sn.includes(tokens[0]!)) {
    return 70;
  }
  if (sn.includes(nq) || nq.includes(sn)) {
    return 60;
  }
  return 0;
}

function matriculaMatchScore(row: FinanceStudentSearchRow, q: string): number {
  const qd = digitsOnly(q);
  if (qd.length < 2 || !row.matricula) {
    return 0;
  }
  if (digitsOnly(row.matricula).includes(qd)) {
    return 85;
  }
  return 0;
}

function teacherMatchScore(row: FinanceStudentSearchRow, q: string): number {
  const nq = normalizeSearch(q.trim());
  if (!nq) {
    return 0;
  }
  let s = 0;
  if (row.teacherName && normalizeSearch(row.teacherName).includes(nq)) {
    s += 55;
  }
  const qd = digitsOnly(q);
  if (qd.length >= 2 && row.teacherEmployeeCode && digitsOnly(row.teacherEmployeeCode).includes(qd)) {
    s += 85;
  }
  return s;
}

/**
 * Pagador, e-mail e documento conforme o que casou na busca (ex.: nome da mãe, CPF do pai, matrícula).
 * Se a busca estiver vazia, usa o mesmo critério de `pickPayerName` / primeiro com e-mail.
 */
export function resolveContactFromSearch(
  row: FinanceStudentSearchRow,
  searchQuery: string,
): {
  payerName: string;
  payerEmail: string;
  payerDocumentDigits: string;
} {
  const q = searchQuery.trim();
  if (!q) {
    return {
      payerName: pickPayerName(row),
      payerEmail: firstGuardianEmail(row),
      payerDocumentDigits: firstGuardianDocumentDigits(row),
    };
  }

  let bestG: { g: FinanceGuardianLine; score: number } | null = null;
  for (const g of row.guardians) {
    const sc = guardianMatchScore(g, q);
    if (sc > 0 && (!bestG || sc > bestG.score)) {
      bestG = { g, score: sc };
    }
  }
  const maxG = bestG?.score ?? -1;
  const sStu = studentNameMatchScore(row, q);
  const sMat = matriculaMatchScore(row, q);
  const sTea = teacherMatchScore(row, q);

  if (maxG >= 40 && maxG >= sStu && maxG >= sMat && maxG >= sTea) {
    const g = bestG!.g;
    return {
      payerName: g.name.trim(),
      payerEmail: g.email?.trim() ?? "",
      payerDocumentDigits: g.document ? digitsOnly(g.document) : "",
    };
  }

  if (sMat >= 80 && maxG < sMat) {
    return {
      payerName: pickPayerName(row),
      payerEmail: firstGuardianEmail(row),
      payerDocumentDigits: firstGuardianDocumentDigits(row),
    };
  }

  return {
    payerName: pickPayerName(row),
    payerEmail: firstGuardianEmail(row),
    payerDocumentDigits: firstGuardianDocumentDigits(row),
  };
}

/** Uma linha curta explicando por que o aluno apareceu para o texto de busca atual (lista de resultados). */
export function describeWhyRowMatched(row: FinanceStudentSearchRow, searchQuery: string): string | null {
  const t = searchQuery.trim();
  if (!t) {
    return null;
  }
  let bestG: { g: FinanceGuardianLine; score: number } | null = null;
  for (const g of row.guardians) {
    const sc = guardianMatchScore(g, t);
    if (sc > 0 && (!bestG || sc > bestG.score)) {
      bestG = { g, score: sc };
    }
  }
  const maxG = bestG?.score ?? -1;
  const sStu = studentNameMatchScore(row, t);
  const sMat = matriculaMatchScore(row, t);
  const sTea = teacherMatchScore(row, t);

  if (maxG >= 40 && maxG >= sStu && maxG >= sMat && maxG >= sTea) {
    const g = bestG!.g;
    const rel = g.relation?.trim();
    return rel ? `${rel}: ${g.name.trim()}` : g.name.trim();
  }
  if (sMat >= 80 && sMat >= maxG) {
    return `Matrícula aluno: ${row.matricula?.trim() ?? ""}`;
  }
  if (sTea >= 55 && sTea >= maxG) {
    const parts: string[] = [];
    if (row.teacherName?.trim()) {
      parts.push(`Professor(a): ${row.teacherName.trim()}`);
    }
    if (row.teacherEmployeeCode?.trim()) {
      parts.push(`matr. func. ${row.teacherEmployeeCode.trim()}`);
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  }
  if (sStu >= 60) {
    return `Aluno: ${row.name.trim()}`;
  }
  return null;
}

export function buildDefaultStudentDescription(row: FinanceStudentSearchRow): string {
  const parts: string[] = [`Aluno: ${row.name.trim()}`];
  if (row.matricula?.trim()) {
    parts.push(`mat. ${row.matricula.trim()}`);
  }
  if (row.classRoomLabel?.trim()) {
    parts.push(row.classRoomLabel.trim());
  }
  return parts.join(" — ");
}

/** Descrição / observação alinhada à busca (inclui “por que” casou, quando houver). */
export function buildDescriptionFromSearch(row: FinanceStudentSearchRow, searchQuery: string): string {
  const base = buildDefaultStudentDescription(row);
  const why = describeWhyRowMatched(row, searchQuery);
  if (why && searchQuery.trim()) {
    return `${base} — Ref. busca: ${why}`;
  }
  return base;
}

export function firstGuardianEmail(row: FinanceStudentSearchRow): string {
  for (const g of row.guardians) {
    const e = g.email?.trim();
    if (e) return e;
  }
  return "";
}

export function firstGuardianDocumentDigits(row: FinanceStudentSearchRow): string {
  for (const g of row.guardians) {
    const d = g.document?.trim();
    if (d) return d.replace(/\D/g, "");
  }
  return "";
}

export function resolveContactFromEmployee(emp: FinanceEmployeeSearchRow): {
  payerName: string;
  payerEmail: string;
  payerDocumentDigits: string;
} {
  return {
    payerName: emp.name.trim(),
    payerEmail: emp.email?.trim() ?? "",
    payerDocumentDigits: emp.document ? digitsOnly(emp.document) : "",
  };
}

export function resolveContactFromSupplier(sup: FinanceSupplierSearchRow): {
  payerName: string;
  payerEmail: string;
  payerDocumentDigits: string;
} {
  const displayName = sup.tradeName?.trim() || sup.name.trim();
  return {
    payerName: displayName,
    payerEmail: sup.email?.trim() ?? "",
    payerDocumentDigits: sup.document ? digitsOnly(sup.document) : "",
  };
}

export function describeWhyEmployeeMatched(emp: FinanceEmployeeSearchRow, q: string): string | null {
  const t = q.trim();
  if (!t) return null;
  const nq = normalizeSearch(t);
  if (normalizeSearch(emp.name).includes(nq)) return emp.name.trim();
  if (emp.nickname?.trim() && normalizeSearch(emp.nickname).includes(nq)) {
    return `Apelido: ${emp.nickname.trim()}`;
  }
  const qd = digitsOnly(t);
  if (qd.length >= 2 && emp.employeeCode && digitsOnly(emp.employeeCode).includes(qd)) {
    return `Matr. func. ${emp.employeeCode.trim()}`;
  }
  if (qd.length >= 2 && emp.document && digitsOnly(emp.document).includes(qd)) {
    return "Documento cadastrado";
  }
  if (emp.jobRole?.trim() && normalizeSearch(emp.jobRole).includes(nq)) {
    return emp.jobRole.trim();
  }
  return null;
}

export function describeWhySupplierMatched(s: FinanceSupplierSearchRow, q: string): string | null {
  const t = q.trim();
  if (!t) return null;
  const nq = normalizeSearch(t);
  if (normalizeSearch(s.name).includes(nq)) return s.name.trim();
  if (s.tradeName?.trim() && normalizeSearch(s.tradeName).includes(nq)) return s.tradeName.trim();
  const qd = digitsOnly(t);
  if (qd.length >= 2 && s.supplierCode && digitsOnly(s.supplierCode).includes(qd)) {
    return `Código ${s.supplierCode.trim()}`;
  }
  if (qd.length >= 2 && s.document && digitsOnly(s.document).includes(qd)) {
    return "Documento (CNPJ/CPF)";
  }
  return null;
}

export function buildDescriptionFromEmployee(emp: FinanceEmployeeSearchRow, searchQuery: string): string {
  const parts: string[] = [`Funcionário(a): ${emp.name.trim()}`];
  if (emp.employeeCode?.trim()) parts.push(`matr. func. ${emp.employeeCode.trim()}`);
  if (emp.jobRole?.trim()) parts.push(emp.jobRole.trim());
  const base = parts.join(" — ");
  const why = describeWhyEmployeeMatched(emp, searchQuery);
  if (why && searchQuery.trim()) {
    return `${base} — Ref. busca: ${why}`;
  }
  return base;
}

export function buildDescriptionFromSupplier(sup: FinanceSupplierSearchRow, searchQuery: string): string {
  const parts: string[] = [`Fornecedor: ${sup.tradeName?.trim() || sup.name.trim()}`];
  if (sup.supplierCode?.trim()) parts.push(`cód. ${sup.supplierCode.trim()}`);
  const base = parts.join(" — ");
  const why = describeWhySupplierMatched(sup, searchQuery);
  if (why && searchQuery.trim()) {
    return `${base} — Ref. busca: ${why}`;
  }
  return base;
}
