import Decimal from "decimal.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import ExcelJS from "exceljs";
import { db } from "../config/database";
import { subscriptions } from "../db/schema/ai365_subscription";
import { eq, desc, and, or, sql, gte, lte, inArray, isNull } from "drizzle-orm";
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
   * Subscription status is derived from date range only: active = at least one
   * subscription where current date is between start_date and end_date (inclusive).
   * Does not use the status field on the subscription table.
   */
  static async getUsersWithActiveSubscription(): Promise<
    { name: string; email: string; mobile: string; fromDate: Date | null; toDate: Date | null }[]
  > {
    // Use DB current date so active/inactive use the same "today" (avoids timezone mismatch)
    const rows = await db
      .select({
        name: users.name,
        email: users.email,
        mobile: users.mobile,
        fromDate: subscriptions.startDate,
        toDate: subscriptions.endDate,
      })
      .from(users)
      .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(
        and(
          sql`(${subscriptions.startDate})::date <= CURRENT_DATE`,
          or(isNull(subscriptions.endDate), sql`(${subscriptions.endDate})::date >= CURRENT_DATE`),
        ),
      )
      .orderBy(desc(subscriptions.endDate));

    // One row per user: keep first (latest end_date) per user
    const byUser = new Map<string, (typeof rows)[0]>();
    for (const r of rows) {
      const key = r.email;
      if (!byUser.has(key)) byUser.set(key, r);
    }
    return Array.from(byUser.values()).map((r) => ({
      name: r.name,
      email: r.email,
      mobile: r.mobile,
      fromDate: r.fromDate,
      toDate: r.toDate,
    }));
  }

  /**
   * Users with no subscription where current date is between start_date and end_date.
   * Includes users with no subscriptions or only past/future subscriptions.
   */
  static async getUsersWithInactiveSubscription(): Promise<
    { name: string; email: string; mobile: string; fromDate: Date | null; toDate: Date | null }[]
  > {
    // Same date rule as active: use DB CURRENT_DATE so lists are disjoint
    const activeUserIds = await db
      .selectDistinct({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(
        and(
          sql`(${subscriptions.startDate})::date <= CURRENT_DATE`,
          or(isNull(subscriptions.endDate), sql`(${subscriptions.endDate})::date >= CURRENT_DATE`),
        ),
      );

    // Normalize to string so Set lookup matches (pg can return uuid as string or buffer)
    const activeIds = new Set(activeUserIds.map((r) => String(r.userId)));
    const allUsers = await db.select({ id: users.id, name: users.name, email: users.email, mobile: users.mobile }).from(users);
    const inactiveUsers = allUsers.filter((u) => !activeIds.has(String(u.id)));

    if (inactiveUsers.length === 0) {
      return [];
    }

    const userIds = inactiveUsers.map((u) => u.id);
    const latestSubs = await db
      .select({
        userId: subscriptions.userId,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
      })
      .from(subscriptions)
      .where(inArray(subscriptions.userId, userIds))
      .orderBy(desc(subscriptions.endDate));

    const subByUser = new Map<string, { startDate: Date; endDate: Date | null }>();
    for (const s of latestSubs) {
      const key = String(s.userId);
      if (!subByUser.has(key)) {
        subByUser.set(key, { startDate: s.startDate, endDate: s.endDate });
      }
    }

    return inactiveUsers.map((u) => {
      const sub = subByUser.get(String(u.id));
      return {
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        fromDate: sub?.startDate ?? null,
        toDate: sub?.endDate ?? null,
      };
    });
  }

  /**
   * Build Excel workbook with two sheets: Active Subscriptions, Inactive Subscriptions.
   * Columns: name, email, mobile, active subscription from date, to date.
   * Active/inactive is based on current date being between start_date and end_date (not status field).
   */
  static async buildSubscriptionUsersExcel(): Promise<Buffer> {
    const [activeRows, inactiveRows] = await Promise.all([
      SubscriptionsService.getUsersWithActiveSubscription(),
      SubscriptionsService.getUsersWithInactiveSubscription(),
    ]);

    const workbook = new ExcelJS.Workbook();

    const formatDate = (d: Date | null) => (d ? dayjs(d).format("YYYY-MM-DD") : "");

    const activeSheet = workbook.addWorksheet("Active Subscriptions");
    activeSheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 35 },
      { header: "Mobile", key: "mobile", width: 16 },
      { header: "Active subscription from date", key: "fromDate", width: 24 },
      { header: "Active subscription to date", key: "toDate", width: 24 },
    ];
    activeRows.forEach((r) => {
      activeSheet.addRow({
        name: r.name,
        email: r.email,
        mobile: r.mobile,
        fromDate: formatDate(r.fromDate),
        toDate: formatDate(r.toDate),
      });
    });

    const inactiveSheet = workbook.addWorksheet("Inactive Subscriptions");
    inactiveSheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 35 },
      { header: "Mobile", key: "mobile", width: 16 },
      { header: "Last subscription from date", key: "fromDate", width: 28 },
      { header: "Last subscription to date", key: "toDate", width: 28 },
    ];
    inactiveRows.forEach((r) => {
      inactiveSheet.addRow({
        name: r.name,
        email: r.email,
        mobile: r.mobile,
        fromDate: formatDate(r.fromDate),
        toDate: formatDate(r.toDate),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
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
