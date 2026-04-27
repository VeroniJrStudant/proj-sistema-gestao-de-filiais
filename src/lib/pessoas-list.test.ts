import { describe, expect, it } from "vitest";
import {
  sortStaffRows,
  sortStudentRows,
  staffRoleSortKey,
} from "./pessoas-list";

describe("staffRoleSortKey", () => {
  it("coloca zeladoria antes de professor", () => {
    expect(staffRoleSortKey("Zelador")).toBeLessThan(staffRoleSortKey("Professora"));
    expect(staffRoleSortKey("zeladoria predial")).toBe(0);
    expect(staffRoleSortKey("Professor — maternal")).toBe(3);
  });

  it("trata cargo vazio como faixa intermediária", () => {
    expect(staffRoleSortKey(null)).toBe(2);
    expect(staffRoleSortKey("")).toBe(2);
  });

  it("ignora acentos na classificação", () => {
    expect(staffRoleSortKey("Educadora")).toBe(3);
  });
});

describe("sortStaffRows", () => {
  it("ordena primeiro por função (zelador antes de professor), depois por nome", () => {
    const rows = [
      { id: "p", name: "Ana", jobRole: "Professora" },
      { id: "z", name: "Bruno", jobRole: "Zelador" },
      { id: "p2", name: "Carla", jobRole: "Professora" },
    ];
    const sorted = sortStaffRows(rows);
    expect(sorted.map((r) => r.id)).toEqual(["z", "p", "p2"]);
  });
});

describe("sortStudentRows", () => {
  it("ordena alunos por nome em pt-BR", () => {
    const rows = [{ id: "b", name: "Bruno" }, { id: "a", name: "Ana" }];
    expect(sortStudentRows(rows).map((r) => r.id)).toEqual(["a", "b"]);
  });
});
