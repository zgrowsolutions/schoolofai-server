import { pgTable, varchar, uuid, decimal, bigint } from "drizzle-orm/pg-core";
import { timestamps } from "../../lib/db.helper";

export const rzpSubscription = pgTable("ai365_rzp_subscription", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: varchar("plan_id", { length: 64 }),
  subscriptionId: varchar("subscription_id", { length: 100 }),
  subscriptionStatus: varchar("subscription_status", { length: 25 }),
  currentStart: bigint("current_start", { mode: "number" }),
  currentEnd: bigint("current_end", { mode: "number" }),
  plan: varchar("paln", { length: 15 }).notNull(),
  amount: decimal("amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  currency: varchar("currency", { length: 15 }),
  method: varchar("method", { length: 25 }),
  userId: uuid("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  mobile: varchar("mobile", { length: 15 }).notNull(),
  paymentId: varchar("payment_id", { length: 100 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 25 }).notNull(),
  ...timestamps,
});
