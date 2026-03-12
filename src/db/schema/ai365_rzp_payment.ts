import { pgTable, varchar, uuid, decimal } from "drizzle-orm/pg-core";
import { timestamps } from "../../lib/db.helper";

export const rzpPayment = pgTable("ai365_rzp_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriptionId: varchar("subscription_id", { length: 100 }),
  plan: varchar("paln", { length: 15 }).notNull(),
  amount: decimal("amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  userId: uuid("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  mobile: varchar("mobile", { length: 15 }).notNull(),
  ...timestamps,
});
