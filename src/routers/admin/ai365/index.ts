import express from "express";

const Router = express.Router();

Router.use("/users", require("./users.route").default);
Router.use("/videos", require("./videos.route").default);
Router.use("/subscriptions", require("./subscription.route").default);

export default Router;
