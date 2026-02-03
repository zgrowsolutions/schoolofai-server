import express from "express";
import { isAI365User } from "../../middlewares/auth.middleware";
const Router = express.Router();

Router.use("/auth", require("./auth.route").default);
Router.use(
  "/subscription",
  isAI365User,
  require("./subscription.route").default,
);
Router.use("/payment", isAI365User, require("./payment.route").default);
Router.use("/hooks", require("./hooks.route").default);

export default Router;
