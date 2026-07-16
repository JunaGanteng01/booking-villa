import { Prisma } from "@prisma/client";

export function isPrismaDatabaseUnavailableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") ||
    (error instanceof Error && error.message.includes("Can't reach database server"))
  );
}
