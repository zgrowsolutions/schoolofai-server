import {
  pgTable,
  varchar,
  text,
  uuid,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { timestamps } from "../../lib/db.helper";

export const videos = pgTable("ai365_videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  video: varchar("video", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  publish_at: timestamp("publish_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  demo: boolean("demo").default(false),
  ...timestamps,
});
