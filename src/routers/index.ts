import express from "express";
const Router = express.Router();

Router.use("/admin", require("./admin").default);
Router.use("/public", require("./public").default);
Router.use("/ai365", require("./ai365").default);

export default Router;
