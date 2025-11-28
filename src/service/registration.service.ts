import { db } from "../config/database";
import { registration } from "../db/schema/registration";
import { InferInsertModel, eq, and, sql, or, ilike } from "drizzle-orm";
import createHttpError from "http-errors";
import { lower } from "../lib/db.helper";

type NewRegistration = InferInsertModel<typeof registration>;

interface ListRegistrationParams {
  page?: number;
  limit?: number;
  search?: string;
  course?: string;
  campaign?: string;
}

export class RegistrationService {
  static async create(data: NewRegistration) {
    try {
      const [existing] = await db
        .select()
        .from(registration)
        .where(
          and(
            eq(lower(registration.email), lower(data.email)),
            eq(lower(registration.course), lower(data.course)),
            eq(lower(registration.campaign), lower(data.campaign))
          )
        );

      if (existing) {
        throw createHttpError.NotAcceptable(
          `Already registered with email ${data.email}`
        );
      }

      const result = await db.insert(registration).values(data);
      return result;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  static async list({
    page = 1,
    limit = 10,
    search,
    course,
    campaign,
  }: ListRegistrationParams) {
    try {
      const offset = (page - 1) * limit;

      // --- Build filters ---
      const filters = [];

      // Keyword search (applies on multiple fields)
      if (search) {
        filters.push(
          or(
            ilike(registration.name, `%${search}%`),
            ilike(registration.email, `%${search}%`),
            ilike(registration.mobile, `%${search}%`)
          )
        );
      }

      if (course) filters.push(eq(registration.course, course));
      if (campaign) filters.push(eq(registration.campaign, campaign));

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      // --- Query ---
      const rows = await db
        .select()
        .from(registration)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${registration.id} DESC`);

      // --- Total count ---
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(registration)
        .where(whereClause);

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  static async delete(id: number) {
    try {
      return await db.delete(registration).where(eq(registration.id, id));
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  static async getCourseOrCampaign(field: "course" | "campaign") {
    try {
      const result = await db
        .select({
          value: registration[field],
        })
        .from(registration)
        .groupBy(registration[field])
        .orderBy(registration[field]);

      return result.map((r) => r.value);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }
}
