import ExcelJS from "exceljs";
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
interface DownloadParams {
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

  static async downloadExcel({ course, campaign }: DownloadParams) {
    const filters = [];

    if (course) filters.push(eq(registration.course, course));
    if (campaign) filters.push(eq(registration.campaign, campaign));

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const rows = await db
      .select()
      .from(registration)
      .where(whereClause)
      .orderBy(sql`${registration.id} DESC`);

    // --- Create Excel ---
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Registrations");

    // Header
    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Mobile", key: "mobile", width: 15 },
      { header: "Course", key: "course", width: 20 },
      { header: "Campaign", key: "campaign", width: 20 },
      { header: "Created At", key: "created_at", width: 20 },
    ];

    // Add rows
    rows.forEach((r) => {
      sheet.addRow({
        id: r.id,
        name: r.name,
        email: r.email,
        mobile: r.mobile,
        course: r.course,
        campaign: r.campaign,
        created_at: r.created_at?.toISOString(),
      });
    });

    // Return Excel as buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
