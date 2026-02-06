import express, { Request, Response } from "express";
import Router from "./routers";
import cors from "cors";
import { errorHandler } from "./middlewares/error_handler.middleware";
import "./events/listener.events";
const app = express();

app.use(
  cors({
    origin: [
      "https://admin.schoolofai.io",
      "https://www.schoolofai.io",
      "https://ai-native-design.schoolofai.io",
      "https://ai365.schoolofai.io",
      "https://app.ai365.schoolofai.io",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/v1", (_: Request, res: Response) => {
  res.json({ message: "API Health is good!" });
});

app.use("/api/v1", Router);

app.use(errorHandler);

export default app;
