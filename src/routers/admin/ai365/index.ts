import express from "express";

const Router = express.Router();

Router.use("/users", require("./users.route").default);
Router.use("/videos", require("./videos.route").default);

export default Router;
