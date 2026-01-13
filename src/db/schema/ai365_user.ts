import { pgTable, varchar, uuid, boolean } from "drizzle-orm/pg-core";
import { timestamps } from "../../lib/db.helper";

export const users = pgTable("ai365_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  mobile: varchar("mobile", { length: 15 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  allow_login: boolean("allow_login").default(false).notNull(),
  active: boolean("active").default(false).notNull(),
  ...timestamps,
});
