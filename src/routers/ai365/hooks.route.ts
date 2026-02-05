import express, { Request, Response } from "express";
import { EasebuzzHook } from "../../controller/ai365_payment.controller";

const Router = express.Router();

Router.post("/easebuzz", EasebuzzHook);

Router.post("/easebuzz/callback", (req: Request, res: Response) => {
  const { status, udf1 } = req.body;
  console.log(req.body);
  console.log("......................................");
  console.log(udf1);
  if (udf1 === "EXISTING_USER") {
    if (status === "success")
      res.redirect("https://app.ai365.schoolofai.io/console/learning");
    else
      res.redirect(
        "https://app.ai365.schoolofai.io/console/account?payment=failed",
      );
  }

  if (status === "success")
    res.redirect("https://app.ai365.schoolofai.io/auth/login");
  else res.redirect("https://ai365.schoolofai.io/signup/payment=failed");
});

export default Router;
