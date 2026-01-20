import { defineConfig } from "prisma/config";

// Lee DATABASE_URL directamente del entorno (sin dotenv en producción)
const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

console.log("Prisma config - DATABASE_URL:", databaseUrl);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
