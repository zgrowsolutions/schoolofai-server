import express from "express";
const Router = express.Router();
import { Create } from "../../controller/registration.controller";
import { Create as AI365Create } from "../../controller/ai365_user.controller";

Router.post("/registration", Create);
Router.post("/ai365-registration", AI365Create);

export default Router;
