import type { FormField, FormTemplate } from "./types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function findValue(
  fields: FormField[],
  data: Record<string, string | string[]>,
  patterns: string[]
): string | null {
  for (const field of fields) {
    const norm = normalize(field.label);
    if (patterns.some((p) => norm.includes(p))) {
      const val = data[field.id];
      if (val) return Array.isArray(val) ? val.join(", ") : val;
    }
  }
  return null;
}

const CATEGORY_KEYWORDS: Array<{ words: string[]; category: string }> = [
  { words: ["parto", "nascimento", "newborn"], category: "Parto/Nascimento" },
  { words: ["gestante", "gravida"], category: "Gestante" },
  { words: ["casamento", "wedding", "noiva", "noivo"], category: "Casamento" },
  { words: ["familia", "family", "familiar"], category: "Família" },
  { words: ["debutante", "15 anos", "debs"], category: "Debutante" },
  { words: ["aniversario", "aniversario"], category: "Aniversário" },
  { words: ["formatura", "formaturas"], category: "Formatura" },
  { words: ["corporativo", "empresa", "corporate"], category: "Corporativo" },
];

function detectCategory(slugOrTitle: string): string | null {
  const norm = normalize(slugOrTitle);
  for (const { words, category } of CATEGORY_KEYWORDS) {
    if (words.some((w) => norm.includes(normalize(w)))) return category;
  }
  return null;
}

export interface ExtractedSubmission {
  contact: {
    name: string | null;
    email: string | null;
    phone: string | null;
    cpf: string | null;
    cep: string | null;
    address: string | null;
    address_number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    source: string;
    tipo: "cliente_pf";
    etapa_venda: "negociacao";
  };
  installmentsHint: number | null;
  extraFields: Array<{ label: string; value: string }>;
  categoryHint: string | null;
}

export function extractFromSubmission(
  template: FormTemplate,
  data: Record<string, string | string[]>
): ExtractedSubmission {
  const fields = template.fields;

  const name = findValue(fields, data, ["nome completo", "nome", "seu nome"]);
  const email = findValue(fields, data, ["email", "e-mail", "seu email"]);
  const phone = findValue(fields, data, ["telefone", "celular", "whatsapp"]);
  const cpf = findValue(fields, data, ["cpf"]);
  const cep = findValue(fields, data, ["cep"]);
  const address = findValue(fields, data, ["endereco", "rua"]);
  const address_number = findValue(fields, data, ["numero", "número"]);
  const complement = findValue(fields, data, ["complemento"]);
  const neighborhood = findValue(fields, data, ["bairro"]);
  const city = findValue(fields, data, ["cidade"]);
  const state = findValue(fields, data, ["estado", "uf"]);

  const installmentsRaw = findValue(fields, data, [
    "parcelas",
    "em quantas vezes",
    "quantas vezes",
  ]);
  let installmentsHint: number | null = null;
  if (installmentsRaw) {
    const n = parseInt(installmentsRaw.replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > 0) installmentsHint = n;
  }

  const mappedFieldIds = new Set<string>();
  const allPatterns = [
    ["nome completo", "nome", "seu nome"],
    ["email", "e-mail", "seu email"],
    ["telefone", "celular", "whatsapp"],
    ["cpf"],
    ["cep"],
    ["endereco", "rua"],
    ["numero", "número"],
    ["complemento"],
    ["bairro"],
    ["cidade"],
    ["estado", "uf"],
    ["parcelas", "em quantas vezes", "quantas vezes"],
    ["data prevista", "data do evento", "data de nascimento"],
  ];

  for (const field of fields) {
    const norm = normalize(field.label);
    for (const patterns of allPatterns) {
      if (patterns.some((p) => norm.includes(p))) {
        mappedFieldIds.add(field.id);
        break;
      }
    }
  }

  const extraFields: Array<{ label: string; value: string }> = fields
    .filter((f) => !mappedFieldIds.has(f.id))
    .map((f) => {
      const val = data[f.id];
      if (!val) return null;
      return { label: f.label, value: Array.isArray(val) ? val.join(", ") : val };
    })
    .filter((x): x is { label: string; value: string } => x !== null && x.value !== "");

  const categoryHint = detectCategory(`${template.title} ${template.slug}`);

  return {
    contact: {
      name,
      email,
      phone,
      cpf,
      cep,
      address,
      address_number,
      complement,
      neighborhood,
      city,
      state,
      source: `Formulário: ${template.title}`,
      tipo: "cliente_pf",
      etapa_venda: "negociacao",
    },
    installmentsHint,
    extraFields,
    categoryHint,
  };
}
