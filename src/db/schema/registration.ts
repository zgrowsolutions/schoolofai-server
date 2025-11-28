import { pgTable, varchar, bigserial } from "drizzle-orm/pg-core";
import { timestamps } from "../../lib/db.helper";

export const registration = pgTable("registration", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  mobile: varchar("mobile", { length: 15 }).notNull(),
  course: varchar("course", { length: 200 }).notNull(),
  campaign: varchar("campaign", { length: 200 }).notNull(),
  ...timestamps,
});
