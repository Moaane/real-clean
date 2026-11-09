import { defineConfig } from "prisma/config";

// Prisma 7 does not load .env by itself.
try {
  process.loadEnvFile();
} catch {
  // .env is optional (e.g. in CI where variables are already set)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
