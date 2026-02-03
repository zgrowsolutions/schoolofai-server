import express from "express";
import { EasebuzzHook } from "../../controller/ai365_payment.controller";

const Router = express.Router();

Router.post("/easebuzz", EasebuzzHook);

Router.use("/easebuzz/surl", (req, res) => {
  console.log(req.method);
  console.log(req.body);
  res.redirect("https://app.ai365.schoolofai.io/console/learning");
});
Router.use("/easebuzz/furl", (req, res) => {
  console.log(req.method);
  console.log(req.body);
  res.redirect(
    "https://app.ai365.schoolofai.io/console/account?payment=failed",
  );
});

export default Router;
