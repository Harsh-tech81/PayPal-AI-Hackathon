import "dotenv/config";
import { defineConfig } from "prisma/config";
import { sanitizePostgresUrl } from "./database/connection-sanitizer.js";

const raw = process.env["DIRECT_URL"] || process.env["DATABASE_URL"] || "";
const { connectionString } = sanitizePostgresUrl(raw);

export default defineConfig({
  schema: "database/prisma/schema.prisma",
  migrations: {
    path: "database/prisma/migrations",
  },
  datasource: {
    url: connectionString,
  },
});
