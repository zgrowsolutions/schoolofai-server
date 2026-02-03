import express, { Request, Response } from "express";
import { EasebuzzHook } from "../../controller/ai365_payment.controller";

const Router = express.Router();

Router.post("/easebuzz", EasebuzzHook);

Router.post("/easebuzz/callback", (req: Request, res: Response) => {
  const { status } = req.body;

  if (status === "success")
    res.redirect("https://app.ai365.schoolofai.io/console/learning");
  else
    res.redirect(
      "https://app.ai365.schoolofai.io/console/account?payment=failed",
    );
});

export default Router;
