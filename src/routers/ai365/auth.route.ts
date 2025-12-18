import express from "express";
import { Login, Me } from "../../controller/ai365_auth.controller";
import { isAI365User } from "../../middlewares/auth.middleware";
const Router = express.Router();

Router.post("/login", Login);
Router.get("/me", isAI365User, Me);

export default Router;
