import { db } from "../config/database";
import { videos } from "../db/schema/ai365_videos";
import {
  eq,
  desc,
  and,
  lte,
  gte,
  or,
  isNull,
  InferSelectModel,
  sql,
} from "drizzle-orm";
import { subscriptions } from "../db/schema/ai365_subscription";

type Video = InferSelectModel<typeof videos>;
export type CreateVideoInput = {
  title: string;
  description?: string | null;
  video: string;
  status: string;
  publish_at?: Date;
  demo?: boolean;
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
        demo: data.demo ?? false,
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
            : (data.description ?? null), // allow null
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

  static async findVideosByUser(userId: string) {
    const now = new Date();

    const freeVideos = await db
      .select()
      .from(videos)
      .where(and(eq(videos.demo, true), eq(videos.status, "published")));

    const activeSubscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          lte(subscriptions.startDate, now),
          or(gte(subscriptions.endDate, now), isNull(subscriptions.endDate)),
        ),
      );

    let premiumVideo: Video[] = [];

    if (activeSubscription.length > 0)
      premiumVideo = await db
        .select()
        .from(videos)
        .where(and(eq(videos.status, "published"), eq(videos.demo, false)))
        .orderBy(sql`${videos.publish_at} DESC`);

    // console.log(activeSubscription);
    return { demo: freeVideos, premium: premiumVideo };
  }
}
