import { db } from "../../config/database";
import { users } from "../schema/user";
import { hashPassword } from "../../lib/auth.helper";

async function seed() {
  console.log("🌱 Seeding database...");

  await db.insert(users).values([
    {
      name: "Pugazhenthi",
      email: "pugazhonline@gmail.com",
      mobile: "9976412129",
      password: hashPassword("password"),
    },
  ]);

  console.log("✅ Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
