import express from "express";

const Router = express.Router();

Router.use("/auth", require("./auth.route").default);

export default Router;
