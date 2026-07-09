// stack_sandbox/frontend_web/src/modules/chat/lib/keelBlocks.ts

// Parse structured ```keel:record``` and ```keel:proposal``` blocks from assistant messages.

export type KeelRecordField = {
  label: string;
  value: string;
};

export type KeelRecordBlock = {
  kind: "record";
  entity: string;
  title: string;
  image_url?: string | null;
  fields: KeelRecordField[];
};

export type KeelProposalMerchant = {
  name: string;
  website_url?: string | null;
  logo_url?: string | null;
  create_new?: boolean;
};

export type KeelProposalBlock = {
  kind: "proposal";
  proposal_id: number;
  entity: string;
  title: string;
  image_url?: string | null;
  fields: KeelRecordField[];
  merchant?: KeelProposalMerchant | null;
};

export type KeelStructuredBlock = KeelRecordBlock | KeelProposalBlock;

const RECORD_LANG = "keel:record";
const PROPOSAL_LANG = "keel:proposal";

export function keelBlockLanguage(className: string | undefined): string | null {
  if (!className) {
    return null;
  }
  const match = /language-([^\s]+)/.exec(className);
  if (!match) {
    return null;
  }
  const lang = match[1];
  if (lang === RECORD_LANG || lang === PROPOSAL_LANG) {
    return lang;
  }
  return null;
}

export function parseKeelBlock(
  language: string,
  raw: string,
): KeelStructuredBlock | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;
    const fields = normalizeFields(data.fields);
    const title = String(data.title ?? "Record");
    const entity = String(data.entity ?? "record");

    if (language === PROPOSAL_LANG || data.kind === "proposal") {
      const proposalId = data.proposal_id;
      if (typeof proposalId !== "number" || proposalId < 1) {
        return null;
      }
      return {
        kind: "proposal",
        proposal_id: proposalId,
        entity,
        title,
        image_url: optionalString(data.image_url),
        fields,
        merchant: normalizeMerchant(data.merchant),
      };
    }

    return {
      kind: "record",
      entity,
      title,
      image_url: optionalString(data.image_url),
      fields,
    };
  } catch {
    return null;
  }
}

function normalizeFields(raw: unknown): KeelRecordField[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const row = entry as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      const value = String(row.value ?? "").trim();
      if (!label) {
        return null;
      }
      return { label, value };
    })
    .filter((row): row is KeelRecordField => row !== null);
}

function normalizeMerchant(raw: unknown): KeelProposalMerchant | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const name = String(row.name ?? "").trim();
  if (!name) {
    return null;
  }
  return {
    name,
    website_url: optionalString(row.website_url),
    logo_url: optionalString(row.logo_url),
    create_new: row.create_new === true,
  };
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}
