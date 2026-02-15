import Decimal from "decimal.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { db } from "../config/database";
import { subscriptions } from "../db/schema/ai365_subscription";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { users } from "../db/schema/ai365_user";

dayjs.extend(utc);
dayjs.extend(timezone);
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
    const tz = process.env.REPORT_TIMEZONE ?? "Asia/Kolkata";
    const now = dayjs().tz(tz);
    const startOfRange = now.subtract(days - 1, "day").startOf("day");
    const endOfRange = now.endOf("day");
    const startDate = startOfRange.toDate();
    const endDate = endOfRange.toDate();

    // Use CTE so the date expression is defined once; otherwise PG rejects GROUP BY
    // (Drizzle emits separate params for same expr in SELECT vs GROUP BY).
    const res = await db.execute(sql`
      WITH sub AS (
        SELECT (created_at AT TIME ZONE ${tz})::date AS d
        FROM subscriptions
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      )
      SELECT to_char(sub.d, 'YYYY-MM-DD') AS date, count(*)::int AS count
      FROM sub
      GROUP BY sub.d
      ORDER BY sub.d
    `);
    const rows = ((res as unknown) as { rows: { date: string; count: number }[] }).rows;

    const countByDate = new Map(rows.map((r) => [r.date, r.count]));

    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dateStr = now.subtract(i, "day").format("YYYY-MM-DD");
      result.push({
        date: dateStr,
        count: countByDate.get(dateStr) ?? 0,
      });
    }
    return result;
  }
}
