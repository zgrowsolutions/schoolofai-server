import express from "express";
import { isAdmin } from "../../middlewares/auth.middleware";

const Router = express.Router();

Router.use("/auth", require("./auth.route").default);
Router.use("/users", isAdmin, require("./users.route").default);
Router.use("/registration", isAdmin, require("./registration.route").default);
Router.use("/ai365", isAdmin, require("./ai365").default);

export default Router;
