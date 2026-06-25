import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClientRev?: number;
};

// bump after `prisma generate` when dev server still serves stale client
const PRISMA_CLIENT_REV = 2;

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — copy .env.example to .env and configure MySQL");
  }
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (cached && globalForPrisma.prismaClientRev === PRISMA_CLIENT_REV) return cached;
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaClientRev = PRISMA_CLIENT_REV;
  }
  return client;
}

export const prisma = getPrismaClient();
