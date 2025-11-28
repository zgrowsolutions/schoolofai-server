import express from "express";
const Router = express.Router();

Router.use("/admin", require("./admin").default);
Router.use("/public", require("./public").default);

export default Router;
