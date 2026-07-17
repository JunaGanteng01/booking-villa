import type { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import {
  listBookingRecords,
  type BookingStoreRecord,
} from "@/lib/booking-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

export type BookingExportFilters = {
  query?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  createdFrom?: Date;
  createdTo?: Date;
};

export type BookingExportDocument = {
  content: string;
  fileName: string;
  mimeType: "application/vnd.ms-excel;charset=utf-8";
  rowCount: number;
  source: "database" | "memory-fallback";
};

type ExportRow = {
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  villaName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  bookingStatus: string;
  paymentStatus: string;
  subtotal: number;
  discountTotal: number;
  serviceFee: number;
  taxTotal: number;
  totalAmount: number;
  currency: string;
  createdAt: Date;
};

const MIME_TYPE = "application/vnd.ms-excel;charset=utf-8" as const;

export async function createBookingExcelExport(
  filters: BookingExportFilters = {},
): Promise<BookingExportDocument> {
  try {
    const bookings = await prisma.booking.findMany({
      where: createDatabaseFilters(filters),
      select: {
        bookingCode: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        villa: { select: { name: true } },
        checkIn: true,
        checkOut: true,
        nights: true,
        guests: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        discountTotal: true,
        serviceFee: true,
        taxTotal: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const rows: ExportRow[] = bookings.map((booking) => ({
      bookingCode: booking.bookingCode,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      villaName: booking.villa.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      subtotal: booking.subtotal,
      discountTotal: booking.discountTotal,
      serviceFee: booking.serviceFee,
      taxTotal: booking.taxTotal,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      createdAt: booking.createdAt,
    }));
    return createDocument(rows, "database");
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) throw error;
  }

  const rows = listBookingRecords()
    .filter((booking) => matchesMemoryFilters(booking, filters))
    .map(normalizeMemoryBooking);
  return createDocument(rows, "memory-fallback");
}

function createDatabaseFilters(
  filters: BookingExportFilters,
): Prisma.BookingWhereInput {
  const query = filters.query?.trim();
  return {
    status: filters.status,
    paymentStatus: filters.paymentStatus,
    createdAt:
      filters.createdFrom || filters.createdTo
        ? { gte: filters.createdFrom, lte: filters.createdTo }
        : undefined,
    OR: query
      ? [
          { bookingCode: { contains: query, mode: "insensitive" } },
          { guestName: { contains: query, mode: "insensitive" } },
          { guestEmail: { contains: query, mode: "insensitive" } },
          { guestPhone: { contains: query, mode: "insensitive" } },
          { villa: { name: { contains: query, mode: "insensitive" } } },
        ]
      : undefined,
  };
}

function matchesMemoryFilters(
  booking: BookingStoreRecord,
  filters: BookingExportFilters,
) {
  const createdAt = new Date(booking.createdAt);
  if (filters.status && booking.status !== filters.status) return false;
  if (
    filters.paymentStatus &&
    booking.paymentStatus !== filters.paymentStatus
  ) {
    return false;
  }
  if (filters.createdFrom && createdAt < filters.createdFrom) return false;
  if (filters.createdTo && createdAt > filters.createdTo) return false;

  const query = filters.query?.trim().toLocaleLowerCase("id-ID");
  if (!query) return true;
  return [
    booking.bookingCode,
    booking.guest.name,
    booking.guest.email,
    booking.guest.phone,
    booking.villaName,
  ].some((value) => value.toLocaleLowerCase("id-ID").includes(query));
}

function normalizeMemoryBooking(booking: BookingStoreRecord): ExportRow {
  return {
    bookingCode: booking.bookingCode,
    guestName: booking.guest.name,
    guestEmail: booking.guest.email,
    guestPhone: booking.guest.phone,
    villaName: booking.villaName,
    checkIn: new Date(booking.checkIn),
    checkOut: new Date(booking.checkOut),
    nights: booking.nights,
    guests: booking.guests,
    bookingStatus: booking.status,
    paymentStatus: booking.paymentStatus,
    subtotal: booking.amounts.subtotal,
    discountTotal: booking.amounts.discountTotal,
    serviceFee: booking.amounts.serviceFee,
    taxTotal: booking.amounts.taxTotal,
    totalAmount: booking.amounts.totalAmount,
    currency: booking.amounts.currency,
    createdAt: new Date(booking.createdAt),
  };
}

function createDocument(
  rows: ExportRow[],
  source: BookingExportDocument["source"],
): BookingExportDocument {
  return {
    content: createSpreadsheetXml(rows),
    fileName: `villaku-booking-${formatDate(new Date())}.xls`,
    mimeType: MIME_TYPE,
    rowCount: rows.length,
    source,
  };
}

function createSpreadsheetXml(rows: ExportRow[]) {
  const headers = [
    "Kode Booking",
    "Nama Tamu",
    "Email",
    "Telepon",
    "Villa",
    "Check-in",
    "Check-out",
    "Malam",
    "Jumlah Tamu",
    "Status Booking",
    "Status Pembayaran",
    "Subtotal",
    "Diskon",
    "Biaya Layanan",
    "Pajak",
    "Total",
    "Mata Uang",
    "Dibuat Pada",
  ];
  const body = rows
    .map((row) =>
      [
        row.bookingCode,
        row.guestName,
        row.guestEmail,
        row.guestPhone,
        row.villaName,
        formatDate(row.checkIn),
        formatDate(row.checkOut),
        row.nights,
        row.guests,
        row.bookingStatus,
        row.paymentStatus,
        row.subtotal,
        row.discountTotal,
        row.serviceFee,
        row.taxTotal,
        row.totalAmount,
        row.currency,
        formatDateTime(row.createdAt),
      ]
        .map((value) => createCell(value))
        .join(""),
    )
    .map((cells) => `<Row>${cells}</Row>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Aptos" ss:Size="11"/></Style>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#047857" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Money"><NumberFormat ss:Format="#,##0"/></Style>
 </Styles>
 <Worksheet ss:Name="Booking">
  <Table>
   <Row>${headers.map((header) => createCell(header, "Header")).join("")}</Row>
   ${body}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

function createCell(value: string | number, style?: "Header" | "Money") {
  const type = typeof value === "number" ? "Number" : "String";
  const inferredStyle =
    style ?? (typeof value === "number" ? "Money" : undefined);
  return `<Cell${inferredStyle ? ` ss:StyleID="${inferredStyle}"` : ""}><Data ss:Type="${type}">${escapeXml(String(value))}</Data></Cell>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
