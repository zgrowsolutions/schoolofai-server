// schema/subscriptions.ts
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { users } from "./ai365_user";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

  plan: varchar("plan", { length: 50 }).notNull(), // annual, monthly

  status: varchar("status", { length: 20 }).notNull().default("active"), // active, cancelled, expired

  price: decimal("price", {
    precision: 10,
    scale: 2,
  }).notNull(),

  isTrial: boolean("is_trial").default(false).notNull(),

  startDate: timestamp("start_date", { withTimezone: true })
    .defaultNow()
    .notNull(),

  endDate: timestamp("end_date", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
