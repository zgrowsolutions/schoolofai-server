import Decimal from "decimal.js";
import { db } from "../config/database";
import { subscriptions } from "../db/schema/ai365_subscription";
import { eq, desc, and, sql, gte } from "drizzle-orm";
import { users } from "../db/schema/ai365_user";
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
      .select({
        id: subscriptions.id,
        userEmail: users.email,
        userName: users.name,
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
      .innerJoin(users, eq(subscriptions.userId, users.id))
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

  /**
   * Get subscription counts per day for the last N days (for bar chart).
   * @param days Number of days to include (default 15)
   * @returns Array of { date: "YYYY-MM-DD", count: number } ordered by date
   */
  static async getSubscriptionCountByDay(days: number = 15): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const rows = await db
      .select({
        date: sql<string>`to_char(${subscriptions.createdAt}::date, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(subscriptions)
      .where(gte(subscriptions.createdAt, startDate))
      .groupBy(sql`${subscriptions.createdAt}::date`)
      .orderBy(sql`${subscriptions.createdAt}::date`);

    const countByDate = new Map(rows.map((r) => [r.date, r.count]));

    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      const dateStr = d.toISOString().slice(0, 10);
      result.push({
        date: dateStr,
        count: countByDate.get(dateStr) ?? 0,
      });
    }
    return result;
  }
}
