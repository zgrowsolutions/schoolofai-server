import express from "express";
import { Login, Me } from "../../controller/auth.controller";
import { isAdmin } from "../../middlewares/auth.middleware";
const Router = express.Router();

Router.post("/login", Login);
Router.get("/me", isAdmin, Me);

export default Router;
