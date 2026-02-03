import { relations } from "drizzle-orm/relations";
import { ai365Users, subscriptions } from "./schema";

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	ai365User: one(ai365Users, {
		fields: [subscriptions.userId],
		references: [ai365Users.id]
	}),
}));

export const ai365UsersRelations = relations(ai365Users, ({many}) => ({
	subscriptions: many(subscriptions),
}));