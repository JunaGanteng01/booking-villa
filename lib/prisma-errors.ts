import { Prisma } from "@prisma/client";

export function isPrismaDatabaseUnavailableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P1001", "P1017"].includes(error.code)) ||
    (error instanceof Error &&
      (error.message.includes("Can't reach database server") ||
        error.message.includes(
          "In order to run Prisma Client on edge runtime",
        )))
  );
}
