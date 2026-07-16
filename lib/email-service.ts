export type EmailAddress = {
  email: string;
  name?: string;
};

export type EmailTag = {
  name: string;
  value: string;
};

export type SendAutomatedEmailInput = {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailAddress;
  replyTo?: EmailAddress;
  tags?: EmailTag[];
  idempotencyKey?: string;
};

export type SendAutomatedEmailResult = {
  id: string;
  provider: "resend" | "mock";
  status: "sent" | "simulated";
  acceptedAt: string;
};

export type MockEmailRecord = SendAutomatedEmailResult & {
  to: EmailAddress[];
  from: EmailAddress;
  subject: string;
  html: string;
  text: string;
  tags: EmailTag[];
  idempotencyKey?: string;
};

type ResendSuccessResponse = {
  id?: string;
};

type ResendErrorResponse = {
  message?: string;
  name?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RECIPIENTS = 50;
const MAX_CONTENT_LENGTH = 500_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const globalForEmail = globalThis as typeof globalThis & {
  villakuMockEmailOutbox?: Map<string, MockEmailRecord>;
};

const mockEmailOutbox = globalForEmail.villakuMockEmailOutbox ?? new Map<string, MockEmailRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForEmail.villakuMockEmailOutbox = mockEmailOutbox;
}

export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

export async function sendAutomatedEmail(
  input: SendAutomatedEmailInput,
): Promise<SendAutomatedEmailResult> {
  const email = normalizeEmailInput(input);
  const deliveryMode = process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const useMock =
    deliveryMode === "mock" || (!apiKey && process.env.NODE_ENV !== "production");

  if (useMock) {
    return storeMockEmail(email);
  }

  if (!apiKey) {
    throw new EmailDeliveryError(
      "Layanan email belum dikonfigurasi.",
      "EMAIL_PROVIDER_NOT_CONFIGURED",
      false,
    );
  }

  return sendWithResend(email, apiKey);
}

export function getMockEmailOutbox() {
  return Array.from(mockEmailOutbox.values()).sort((a, b) =>
    b.acceptedAt.localeCompare(a.acceptedAt),
  );
}

export function clearMockEmailOutbox() {
  mockEmailOutbox.clear();
}

async function sendWithResend(
  email: ReturnType<typeof normalizeEmailInput>,
  apiKey: string,
): Promise<SendAutomatedEmailResult> {
  const maxAttempts = 3;
  let lastError: EmailDeliveryError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(email.idempotencyKey
            ? { "Idempotency-Key": email.idempotencyKey }
            : {}),
        },
        body: JSON.stringify({
          from: formatAddress(email.from),
          to: email.to.map(formatAddress),
          subject: email.subject,
          html: email.html,
          text: email.text,
          reply_to: email.replyTo ? formatAddress(email.replyTo) : undefined,
          tags: email.tags.length ? email.tags : undefined,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as
        | ResendSuccessResponse
        | ResendErrorResponse;

      if (response.ok && "id" in payload && payload.id) {
        return {
          id: payload.id,
          provider: "resend",
          status: "sent",
          acceptedAt: new Date().toISOString(),
        };
      }

      const retryable = response.status === 429 || response.status >= 500;
      const providerMessage =
        "message" in payload && payload.message
          ? payload.message
          : "Provider email menolak permintaan.";
      lastError = new EmailDeliveryError(
        providerMessage,
        "EMAIL_PROVIDER_REJECTED",
        retryable,
        response.status,
      );
    } catch (error) {
      lastError =
        error instanceof Error && error.name === "AbortError"
          ? new EmailDeliveryError(
              "Pengiriman email melewati batas waktu.",
              "EMAIL_PROVIDER_TIMEOUT",
              true,
            )
          : new EmailDeliveryError(
              "Layanan email tidak dapat dihubungi.",
              "EMAIL_PROVIDER_UNREACHABLE",
              true,
            );
    } finally {
      clearTimeout(timeout);
    }

    if (!lastError.retryable || attempt === maxAttempts) break;
    await delay(250 * 2 ** (attempt - 1));
  }

  throw (
    lastError ??
    new EmailDeliveryError(
      "Pengiriman email gagal.",
      "EMAIL_DELIVERY_FAILED",
      false,
    )
  );
}

function storeMockEmail(email: ReturnType<typeof normalizeEmailInput>) {
  if (email.idempotencyKey) {
    const existing = Array.from(mockEmailOutbox.values()).find(
      (record) => record.idempotencyKey === email.idempotencyKey,
    );
    if (existing) return existing;
  }

  const acceptedAt = new Date().toISOString();
  const result: MockEmailRecord = {
    id: `mock_email_${crypto.randomUUID()}`,
    provider: "mock",
    status: "simulated",
    acceptedAt,
    to: email.to,
    from: email.from,
    subject: email.subject,
    html: email.html,
    text: email.text,
    tags: email.tags,
    idempotencyKey: email.idempotencyKey,
  };

  mockEmailOutbox.set(result.id, result);
  return result;
}

function normalizeEmailInput(input: SendAutomatedEmailInput) {
  const to = (Array.isArray(input.to) ? input.to : [input.to]).map((address) =>
    normalizeAddress(address, "penerima"),
  );
  const from = normalizeAddress(
    input.from ?? {
      email: process.env.EMAIL_FROM_ADDRESS || "noreply@villaku.test",
      name: process.env.EMAIL_FROM_NAME || "Villaku Private Resorts",
    },
    "pengirim",
  );
  const replyTo = input.replyTo ? normalizeAddress(input.replyTo, "reply-to") : undefined;
  const subject = normalizeHeaderValue(input.subject, "Subjek");
  const html = input.html.trim();
  const text = input.text?.trim() || htmlToPlainText(html);
  const tags = (input.tags ?? []).map((tag) => ({
    name: normalizeTagPart(tag.name, "nama tag"),
    value: normalizeTagPart(tag.value, "nilai tag"),
  }));
  const idempotencyKey = input.idempotencyKey?.trim();

  if (!to.length || to.length > MAX_RECIPIENTS) {
    throw new EmailDeliveryError(
      `Jumlah penerima harus antara 1 dan ${MAX_RECIPIENTS}.`,
      "INVALID_EMAIL_RECIPIENTS",
      false,
    );
  }
  if (!subject || subject.length > 180) {
    throw new EmailDeliveryError(
      "Subjek email wajib diisi dan maksimal 180 karakter.",
      "INVALID_EMAIL_SUBJECT",
      false,
    );
  }
  if (!html || html.length > MAX_CONTENT_LENGTH || text.length > MAX_CONTENT_LENGTH) {
    throw new EmailDeliveryError(
      "Konten email wajib diisi dan maksimal 500 KB.",
      "INVALID_EMAIL_CONTENT",
      false,
    );
  }
  if (
    idempotencyKey &&
    (idempotencyKey.length > 256 || !/^[a-zA-Z0-9_:\-.]+$/.test(idempotencyKey))
  ) {
    throw new EmailDeliveryError(
      "Idempotency key email tidak valid.",
      "INVALID_IDEMPOTENCY_KEY",
      false,
    );
  }

  return {
    to,
    from,
    replyTo,
    subject,
    html,
    text,
    tags,
    idempotencyKey,
  };
}

function normalizeAddress(address: EmailAddress, label: string): EmailAddress {
  const email = address.email.trim().toLowerCase();
  const name = address.name ? normalizeHeaderValue(address.name, `Nama ${label}`) : undefined;

  if (!EMAIL_PATTERN.test(email)) {
    throw new EmailDeliveryError(
      `Alamat email ${label} tidak valid.`,
      "INVALID_EMAIL_ADDRESS",
      false,
    );
  }

  return { email, name };
}

function normalizeHeaderValue(value: string, label: string) {
  const normalized = value.trim();
  if (/\r|\n/.test(normalized)) {
    throw new EmailDeliveryError(
      `${label} mengandung karakter yang tidak diizinkan.`,
      "INVALID_EMAIL_HEADER",
      false,
    );
  }
  return normalized;
}

function normalizeTagPart(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 256 || !/^[a-zA-Z0-9_-]+$/.test(normalized)) {
    throw new EmailDeliveryError(
      `${label} email tidak valid.`,
      "INVALID_EMAIL_TAG",
      false,
    );
  }
  return normalized;
}

function formatAddress(address: EmailAddress) {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

function htmlToPlainText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
