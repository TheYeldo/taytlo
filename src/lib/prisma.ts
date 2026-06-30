import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  taytloPrisma?: PrismaClient;
};

export function getPrisma() {
  if (!globalForPrisma.taytloPrisma) {
    globalForPrisma.taytloPrisma = new PrismaClient();
  }
  return globalForPrisma.taytloPrisma;
}
