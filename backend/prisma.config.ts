import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need a session/direct connection. On Supabase, DATABASE_URL is the
    // transaction pooler (port 6543, used by the app at runtime), so DIRECT_URL
    // (session pooler or direct, port 5432) takes precedence here when it is set.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
