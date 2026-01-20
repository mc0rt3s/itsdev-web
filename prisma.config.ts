import "dotenv/config";
import { defineConfig } from "prisma/config";

// En producción usa DATABASE_URL, en desarrollo usa el archivo local
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
