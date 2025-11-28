import express, { Request, Response } from "express";
import Router from "./routers";
import cors from "cors";
import { errorHandler } from "./middlewares/error_handler.middleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/v1", (_: Request, res: Response) => {
  res.json({ message: "API Health is good!" });
});

app.use("/api/v1", Router);

app.use(errorHandler);

export default app;
