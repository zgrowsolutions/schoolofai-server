import { pgTable, bigserial, varchar, timestamp, unique, uuid, boolean, foreignKey, numeric, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const registration = pgTable("registration", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 150 }).notNull(),
	mobile: varchar({ length: 15 }).notNull(),
	course: varchar({ length: 200 }).notNull(),
	campaign: varchar({ length: 200 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 150 }).notNull(),
	mobile: varchar({ length: 15 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_mobile_unique").on(table.mobile),
]);

export const ai365Users = pgTable("ai365_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 150 }).notNull(),
	mobile: varchar({ length: 15 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	allowLogin: boolean("allow_login").default(false).notNull(),
	active: boolean().default(false).notNull(),
}, (table) => [
	unique("ai365_users_email_unique").on(table.email),
	unique("ai365_users_mobile_unique").on(table.mobile),
]);

export const subscriptions = pgTable("subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	plan: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	isTrial: boolean("is_trial").default(false).notNull(),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [ai365Users.id],
			name: "subscriptions_user_id_ai365_users_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const ai365Videos = pgTable("ai365_videos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	video: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 255 }).notNull(),
	publishAt: timestamp("publish_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	demo: boolean().default(false),
});
