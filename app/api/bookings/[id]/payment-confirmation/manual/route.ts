import { NextResponse } from "next/server";
import { getBookingByCode, getBookingById } from "@/lib/booking-store";
import {
  getSavedPaymentMethod,
  saveManualPaymentProof,
} from "@/lib/payment-store";

type ManualProofJsonInput = {
  senderName?: string | null;
  senderBank?: string | null;
  transferDate?: string | null;
  amount?: number | string | null;
  note?: string | null;
  proof?: {
    fileName?: string | null;
    fileType?: string | null;
    fileSize?: number | string | null;
  } | null;
};

export async function POST(request: Request) {
  const bookingId = decodeURIComponent(
    new URL(request.url).pathname.split("/").filter(Boolean)[2] ?? "",
  );
  const booking = getBookingById(bookingId) ?? getBookingByCode(bookingId);

  if (!booking) {
    return NextResponse.json(
      {
        error: "BOOKING_NOT_FOUND",
        message: "Pesanan tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const savedPayment = getSavedPaymentMethod(booking.id);
  if (!savedPayment) {
    return NextResponse.json(
      {
        error: "PAYMENT_METHOD_REQUIRED",
        message: "Pilih metode pembayaran sebelum mengunggah bukti transfer.",
      },
      { status: 409 },
    );
  }

  if (savedPayment.method.id !== "bank-transfer") {
    return NextResponse.json(
      {
        error: "PAYMENT_METHOD_NOT_MANUAL",
        message: "Bukti transfer manual hanya berlaku untuk metode bank transfer.",
      },
      { status: 409 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  const input = contentType.includes("multipart/form-data")
    ? await parseMultipartInput(request)
    : await parseJsonInput(request);

  if (!input.ok) {
    return NextResponse.json(
      {
        error: input.error,
        message: input.message,
      },
      { status: 400 },
    );
  }

  const proof = saveManualPaymentProof({
    booking,
    senderName: input.data.senderName,
    senderBank: input.data.senderBank,
    transferDate: input.data.transferDate,
    amount: input.data.amount,
    note: input.data.note,
    proof: input.data.proof,
  });

  return NextResponse.json(
    {
      data: {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        payment: savedPayment,
        proof,
        nextAction: {
          type: "WAITING_REVIEW",
          href: `/api/bookings/${booking.id}/payment-status`,
        },
      },
      meta: {
        source: "mock-store",
        note: "File belum diunggah ke storage asli; metadata bukti transfer disimpan sebagai mock.",
      },
    },
    { status: 201 },
  );
}

async function parseJsonInput(request: Request) {
  let body: ManualProofJsonInput;

  try {
    body = (await request.json()) as ManualProofJsonInput;
  } catch {
    return {
      ok: false as const,
      error: "INVALID_JSON",
      message: "Body request harus JSON valid.",
    };
  }

  return normalizeManualProofInput({
    senderName: normalizeString(body.senderName),
    senderBank: normalizeString(body.senderBank),
    transferDate: normalizeString(body.transferDate),
    amount: body.amount,
    note: normalizeString(body.note),
    proof: {
      fileName: normalizeString(body.proof?.fileName),
      fileType: normalizeString(body.proof?.fileType),
      fileSize: body.proof?.fileSize,
    },
  });
}

async function parseMultipartInput(request: Request) {
  const form = await request.formData();
  const file = form.get("proof");
  const proof =
    file && typeof file === "object" && "name" in file
      ? {
          fileName: String(file.name),
          fileType: "type" in file ? String(file.type) : "application/octet-stream",
          fileSize: "size" in file ? Number(file.size) : 0,
        }
      : {
          fileName: "",
          fileType: "",
          fileSize: 0,
        };

  return normalizeManualProofInput({
    senderName: normalizeString(form.get("senderName")),
    senderBank: normalizeString(form.get("senderBank")),
    transferDate: normalizeString(form.get("transferDate")),
    amount: form.get("amount"),
    note: normalizeString(form.get("note")),
    proof,
  });
}

function normalizeManualProofInput(input: {
  senderName: string;
  senderBank: string;
  transferDate: string;
  amount: number | string | FormDataEntryValue | null | undefined;
  note: string;
  proof: {
    fileName: string;
    fileType: string;
    fileSize: number | string | null | undefined;
  };
}) {
  if (input.senderName.length < 2) {
    return {
      ok: false as const,
      error: "INVALID_SENDER_NAME",
      message: "Nama pengirim minimal 2 karakter.",
    };
  }

  if (input.senderBank.length < 2) {
    return {
      ok: false as const,
      error: "INVALID_SENDER_BANK",
      message: "Bank asal wajib diisi.",
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.transferDate)) {
    return {
      ok: false as const,
      error: "INVALID_TRANSFER_DATE",
      message: "Tanggal transfer harus berformat YYYY-MM-DD.",
    };
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false as const,
      error: "INVALID_AMOUNT",
      message: "Nominal transfer wajib lebih dari 0.",
    };
  }

  const fileSize = Number(input.proof.fileSize);
  if (!input.proof.fileName || !input.proof.fileType || !Number.isFinite(fileSize) || fileSize <= 0) {
    return {
      ok: false as const,
      error: "INVALID_PROOF_FILE",
      message: "Bukti transfer wajib diunggah.",
    };
  }

  if (fileSize > 5 * 1024 * 1024) {
    return {
      ok: false as const,
      error: "PROOF_FILE_TOO_LARGE",
      message: "Ukuran bukti transfer maksimal 5MB.",
    };
  }

  return {
    ok: true as const,
    data: {
      senderName: input.senderName,
      senderBank: input.senderBank,
      transferDate: input.transferDate,
      amount: Math.round(amount),
      note: input.note || null,
      proof: {
        fileName: input.proof.fileName,
        fileType: input.proof.fileType,
        fileSize,
      },
    },
  };
}

function normalizeString(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}
