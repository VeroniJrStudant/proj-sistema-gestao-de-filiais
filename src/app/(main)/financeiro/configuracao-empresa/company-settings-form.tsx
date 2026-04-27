"use client";

import { useState, useTransition } from "react";
import type { CompanySettingsFormValues } from "@/lib/company-settings";
import { saveCompanySettings } from "./actions";

const inputClass =
  "mt-0.5 w-full rounded-lg border border-line bg-elevated-2 px-2 py-1.5 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-xs font-medium text-muted";

export function CompanySettingsForm({ initial }: { initial: CompanySettingsFormValues }) {
  const [values, setValues] = useState<CompanySettingsFormValues>(initial);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function patch<K extends keyof CompanySettingsFormValues>(key: K, v: CompanySettingsFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setMessage(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await saveCompanySettings(values);
      if (res.ok) {
        setMessage({ type: "ok", text: "Dados da empresa salvos." });
      } else {
        setMessage({ type: "err", text: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-labelledby="sec-identificacao"
      >
        <h2 id="sec-identificacao" className="text-sm font-semibold text-ink">
          Identificação da unidade
        </h2>
        <p className="mt-1 text-xs text-muted">
          Razão social e CNPJ aparecem em boletos, NF-e e contratos. Campos opcionais podem ser preenchidos
          conforme a integração com o banco ou ERP.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="legalName">
              Razão social
            </label>
            <input
              id="legalName"
              className={inputClass}
              value={values.legalName}
              onChange={(e) => patch("legalName", e.target.value)}
              autoComplete="organization"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="tradeName">
              Nome fantasia
            </label>
            <input
              id="tradeName"
              className={inputClass}
              value={values.tradeName}
              onChange={(e) => patch("tradeName", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="cnpj">
              CNPJ
            </label>
            <input
              id="cnpj"
              className={inputClass}
              value={values.cnpj}
              onChange={(e) => patch("cnpj", e.target.value)}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="stateRegistration">
              Inscrição estadual
            </label>
            <input
              id="stateRegistration"
              className={inputClass}
              value={values.stateRegistration}
              onChange={(e) => patch("stateRegistration", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="municipalRegistration">
              Inscrição municipal
            </label>
            <input
              id="municipalRegistration"
              className={inputClass}
              value={values.municipalRegistration}
              onChange={(e) => patch("municipalRegistration", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-labelledby="sec-endereco"
      >
        <h2 id="sec-endereco" className="text-sm font-semibold text-ink">
          Endereço
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className={labelClass} htmlFor="street">
              Logradouro
            </label>
            <input
              id="street"
              className={inputClass}
              value={values.street}
              onChange={(e) => patch("street", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="number">
              Número
            </label>
            <input id="number" className={inputClass} value={values.number} onChange={(e) => patch("number", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="complement">
              Complemento
            </label>
            <input
              id="complement"
              className={inputClass}
              value={values.complement}
              onChange={(e) => patch("complement", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="neighborhood">
              Bairro
            </label>
            <input
              id="neighborhood"
              className={inputClass}
              value={values.neighborhood}
              onChange={(e) => patch("neighborhood", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="city">
              Cidade
            </label>
            <input id="city" className={inputClass} value={values.city} onChange={(e) => patch("city", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="state">
              UF
            </label>
            <input
              id="state"
              className={inputClass}
              maxLength={2}
              value={values.state}
              onChange={(e) => patch("state", e.target.value.toUpperCase())}
              placeholder="SP"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="zip">
              CEP
            </label>
            <input id="zip" className={inputClass} value={values.zip} onChange={(e) => patch("zip", e.target.value)} />
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-labelledby="sec-contato"
      >
        <h2 id="sec-contato" className="text-sm font-semibold text-ink">
          Contato
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="phone">
              Telefone / WhatsApp
            </label>
            <input id="phone" className={inputClass} value={values.phone} onChange={(e) => patch("phone", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="financeEmail">
              E-mail financeiro
            </label>
            <input
              id="financeEmail"
              type="email"
              className={inputClass}
              value={values.financeEmail}
              onChange={(e) => patch("financeEmail", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="website">
              Site
            </label>
            <input id="website" className={inputClass} value={values.website} onChange={(e) => patch("website", e.target.value)} />
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-labelledby="sec-banco"
      >
        <h2 id="sec-banco" className="text-sm font-semibold text-ink">
          Conta bancária (recebimentos, TED, depósitos)
        </h2>
        <p className="mt-1 text-xs text-muted">
          Dados para exibição em recibos e conferência. Integrações com banco podem exigir credenciais no
          servidor — use as observações abaixo para anotar o que foi acordado com o gerente.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="bankCode">
              Código do banco
            </label>
            <input id="bankCode" className={inputClass} value={values.bankCode} onChange={(e) => patch("bankCode", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="bankName">
              Nome do banco
            </label>
            <input id="bankName" className={inputClass} value={values.bankName} onChange={(e) => patch("bankName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="agency">
              Agência
            </label>
            <input id="agency" className={inputClass} value={values.agency} onChange={(e) => patch("agency", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="agencyDigit">
              Dígito agência
            </label>
            <input
              id="agencyDigit"
              className={inputClass}
              value={values.agencyDigit}
              onChange={(e) => patch("agencyDigit", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="accountNumber">
              Conta
            </label>
            <input
              id="accountNumber"
              className={inputClass}
              value={values.accountNumber}
              onChange={(e) => patch("accountNumber", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="accountDigit">
              Dígito conta
            </label>
            <input
              id="accountDigit"
              className={inputClass}
              value={values.accountDigit}
              onChange={(e) => patch("accountDigit", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="accountType">
              Tipo de conta
            </label>
            <input
              id="accountType"
              className={inputClass}
              value={values.accountType}
              onChange={(e) => patch("accountType", e.target.value)}
              placeholder="Corrente, poupança, pagamento…"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass} htmlFor="depositNotes">
            Observações sobre depósitos e conciliação
          </label>
          <textarea
            id="depositNotes"
            rows={3}
            className={inputClass}
            value={values.depositNotes}
            onChange={(e) => patch("depositNotes", e.target.value)}
          />
        </div>
      </section>

      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-labelledby="sec-pix"
      >
        <h2 id="sec-pix" className="text-sm font-semibold text-ink">
          PIX
        </h2>
        <p className="mt-1 text-xs text-muted">
          A chave PIX e o nome da cidade também podem vir das variáveis{" "}
          <code className="rounded bg-accent-soft px-1 text-[11px] text-ink">SCHOOL_PIX_KEY</code>,{" "}
          <code className="rounded bg-accent-soft px-1 text-[11px] text-ink">SCHOOL_NAME</code> e{" "}
          <code className="rounded bg-accent-soft px-1 text-[11px] text-ink">SCHOOL_CITY</code> no servidor. O
          que estiver preenchido aqui tem prioridade para nome fantasia, cidade e chave.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="pixKeyType">
              Tipo da chave
            </label>
            <input
              id="pixKeyType"
              className={inputClass}
              value={values.pixKeyType}
              onChange={(e) => patch("pixKeyType", e.target.value)}
              placeholder="CPF, CNPJ, e-mail, telefone, EVP…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="pixKey">
              Chave PIX
            </label>
            <input
              id="pixKey"
              className={inputClass}
              value={values.pixKey}
              onChange={(e) => patch("pixKey", e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-labelledby="sec-boleto"
      >
        <h2 id="sec-boleto" className="text-sm font-semibold text-ink">
          Boletos e cobrança
        </h2>
        <p className="mt-1 text-xs text-muted">
          Convênio e carteira costumam ser fornecidos pelo banco. Instruções padrão aparecem nos boletos
          gerados pela instituição financeira.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="boletoConvenio">
              Convênio / contrato
            </label>
            <input
              id="boletoConvenio"
              className={inputClass}
              value={values.boletoConvenio}
              onChange={(e) => patch("boletoConvenio", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="boletoCarteira">
              Carteira
            </label>
            <input
              id="boletoCarteira"
              className={inputClass}
              value={values.boletoCarteira}
              onChange={(e) => patch("boletoCarteira", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="boletoVariacao">
              Variação
            </label>
            <input
              id="boletoVariacao"
              className={inputClass}
              value={values.boletoVariacao}
              onChange={(e) => patch("boletoVariacao", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="boletoInstrucoes">
              Instruções ao pagador (padrão)
            </label>
            <textarea
              id="boletoInstrucoes"
              rows={3}
              className={inputClass}
              value={values.boletoInstrucoes}
              onChange={(e) => patch("boletoInstrucoes", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="boletoBatchNotes">
              Boletos em lote (processo, arquivo remessa, retorno)
            </label>
            <textarea
              id="boletoBatchNotes"
              rows={3}
              className={inputClass}
              value={values.boletoBatchNotes}
              onChange={(e) => patch("boletoBatchNotes", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
        aria-labelledby="sec-pagar"
      >
        <h2 id="sec-pagar" className="text-sm font-semibold text-ink">
          Contas a pagar, faturas e NF-e
        </h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className={labelClass} htmlFor="invoicePaymentNotes">
              Pagamento de faturas e fornecedores
            </label>
            <textarea
              id="invoicePaymentNotes"
              rows={3}
              className={inputClass}
              value={values.invoicePaymentNotes}
              onChange={(e) => patch("invoicePaymentNotes", e.target.value)}
              placeholder="Prazos, aprovação dupla, forma preferencial (PIX, boleto), contatos…"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="nfeNotes">
              NF-e e notas fiscais
            </label>
            <textarea
              id="nfeNotes"
              rows={3}
              className={inputClass}
              value={values.nfeNotes}
              onChange={(e) => patch("nfeNotes", e.target.value)}
              placeholder="Regime, CSC, série, ambiente de homologação…"
            />
          </div>
        </div>
      </section>

      {message ? (
        <p
          role="status"
          className={`text-sm ${message.type === "ok" ? "text-accent-muted" : "text-warn-text"}`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar dados da empresa"}
        </button>
      </div>
    </form>
  );
}
