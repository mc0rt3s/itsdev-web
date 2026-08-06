import { defineConfig } from "prisma/config";

// Lee DATABASE_URL directamente del entorno (sin dotenv en producción)
const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
