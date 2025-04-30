import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  out: "./drizzle",
  schema: "./app/api/data/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATA_SOURCE!,
  },
});
