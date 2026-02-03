import Decimal from "decimal.js";
import { db } from "../config/database";
import { subscriptions } from "../db/schema/ai365_subscription";
import { eq, desc, and, sql } from "drizzle-orm";

/** Create subscription input */
export type CreateSubscriptionInput = {
  userId: string;
  plan: "annual" | "monthly";
  status?: "active" | "cancelled" | "expired";
  price: number;
  isTrial?: boolean;
  startDate?: Date;
  endDate?: Date | null;
};

/** Create subscription */
export class SubscriptionsService {
  static async create(data: CreateSubscriptionInput) {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId: data.userId,
        plan: data.plan,
        status: data.status ?? "active",
        price: data.price.toString(), // decimal expects string
        isTrial: data.isTrial ?? false,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate:
          data.endDate === undefined
            ? undefined
            : data.endDate
              ? new Date(data.endDate)
              : null,
      })
      .returning();

    return subscription;
  }

  /** Get all subscriptions */
  static async findAll() {
    return db
      .select()
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt));
  }

  /** Get subscription by ID */
  static async findById(id: string) {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));

    return subscription ?? null;
  }

  /** Get subscriptions by user */
  static async findByUserId(userId: string) {
    const data = await db
      .select({
        id: subscriptions.id,
        plan: subscriptions.plan,
        price: subscriptions.price,
        start: subscriptions.startDate,
        end: subscriptions.endDate,
        status: sql<string>`
        CASE
          WHEN ${subscriptions.endDate} IS NULL THEN 'active'
          WHEN ${subscriptions.endDate} > now() THEN 'active'
          ELSE 'expired'
        END
      `.as("is_active"),
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.endDate));

    return data.map((i) => ({
      ...i,
      price: new Decimal(i.price),
    }));
  }

  /** Get active subscription for user */
  static async findActiveByUser(userId: string) {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
        ),
      );

    return subscription ?? null;
  }

  /** Update subscription */
  static async update(id: string, data: Partial<CreateSubscriptionInput>) {
    const [updated] = await db
      .update(subscriptions)
      .set({
        ...data,
        price: data.price === undefined ? undefined : data.price.toString(),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate:
          data.endDate === undefined
            ? undefined
            : data.endDate
              ? new Date(data.endDate)
              : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();

    return updated;
  }

  /** Cancel subscription */
  static async cancel(id: string) {
    const [updated] = await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        endDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();

    return updated;
  }

  /** Delete subscription */
  static async delete(id: string) {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
    return true;
  }
}
