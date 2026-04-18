import dotenv from "dotenv";
dotenv.config();

// Prisma 7 with the new `prisma-client` generator outputs a TypeScript ESM
// module at generated/prisma/client.ts — import it directly, no createRequire needed.
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export default prisma;