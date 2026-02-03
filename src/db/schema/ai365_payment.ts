import { pgTable, varchar, uuid, decimal } from "drizzle-orm/pg-core";
import { timestamps } from "../../lib/db.helper";
import { users } from "./ai365_user";

export const payment = pgTable("ai365_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  txnid: uuid("txnid").notNull(),
  plan: varchar("paln", { length: 15 }).notNull(),
  price: decimal("price", {
    precision: 10,
    scale: 2,
  }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  status: varchar("status", { length: 15 }).notNull(),
  mode: varchar("mode", { length: 25 }),
  ...timestamps,
});
