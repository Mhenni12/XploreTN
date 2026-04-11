///////// pour que le code marche utiliser cette partie

import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrate: {
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  },
});

////////// pour changer dans la bd utiliser cette partie
/*
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
*/
