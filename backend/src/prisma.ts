import dotenv from "dotenv";
dotenv.config(); // Doit être avant tout le reste

// Ensure that the generated Prisma client is compatible with ESNext imports
import prismaPkg from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = prismaPkg as any;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export default prisma;
