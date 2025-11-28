import { timestamp } from "drizzle-orm/pg-core";
import { SQL, sql } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";

export const timestamps = {
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const lower = (email: AnyPgColumn | string): SQL => {
  return sql`lower(${email})`;
};
