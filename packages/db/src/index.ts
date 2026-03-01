export * from "./schema";
export { db, getDb } from "./client";
// Re-export drizzle-orm helpers so web app uses the same instance
export {
  eq,
  and,
  or,
  desc,
  asc,
  count,
  sql,
  lt,
  gt,
  inArray,
  isNull,
  isNotNull,
} from "drizzle-orm";
