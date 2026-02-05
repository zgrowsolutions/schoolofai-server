import express from "express";
const Router = express.Router();
import { Create } from "../../controller/registration.controller";
import { TempCreate as AI365TempCreate } from "../../controller/ai365_user.controller";

Router.post("/registration", Create);
Router.post("/ai365-registration", AI365TempCreate);

export default Router;
