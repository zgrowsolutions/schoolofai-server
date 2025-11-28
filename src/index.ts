import app from "./server";
import { config } from "./config/env";
import { pool } from "./config/database";

const server = app.listen(config.port, () => {
  console.log(
    `Server is running on http://localhost:${config.port} in ${config.node_env} mode`
  );
});

const shutdown = async () => {
  if (pool.ended || pool.ending) return;
  console.log("🛑 Shutting down gracefully...");
  server.close(async () => {
    console.log("✅ Server closed");

    try {
      await pool.end();
      console.log("✅ Database pool closed");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error closing pool:", err);
      process.exit(1);
    }
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
