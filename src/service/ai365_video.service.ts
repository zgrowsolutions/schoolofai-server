import { db } from "../config/database";
import { videos } from "../db/schema/ai365_videos";
import { eq, desc, asc } from "drizzle-orm";

export type CreateVideoInput = {
  title: string;
  description?: string | null;
  video: string;
  status: string;
  publish_at?: Date;
};

export class VideosService {
  /** Create video */
  static async create(data: CreateVideoInput) {
    const [video] = await db
      .insert(videos)
      .values({
        title: data.title,
        description: data.description ?? null,
        video: data.video,
        status: data.status,
        publish_at: data.publish_at ? new Date(data.publish_at) : undefined, // optional, defaultNow() applies
      })
      .returning();

    return video;
  }

  /** Get all videos */
  static async findAll() {
    return db.select().from(videos).orderBy(desc(videos.publish_at));
  }

  /** Get single video by ID */
  static async findById(id: string) {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));

    return video ?? null;
  }

  /** Update video */
  static async update(id: string, data: Partial<CreateVideoInput>) {
    const [updated] = await db
      .update(videos)
      .set({
        ...data,
        description:
          data.description === undefined
            ? undefined // don’t touch
            : data.description ?? null, // allow null
        publish_at: data.publish_at ? new Date(data.publish_at) : undefined, // optional, defaultNow() applies
        updated_at: new Date(), // from timestamps helper
      })
      .where(eq(videos.id, id))
      .returning();

    return updated;
  }

  /** Delete video */
  static async delete(id: string) {
    await db.delete(videos).where(eq(videos.id, id));
    return true;
  }
}
