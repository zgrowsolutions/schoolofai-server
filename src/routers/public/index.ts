import express from "express";
const Router = express.Router();
import { Create } from "../../controller/registration.controller";

Router.post("/registration", Create);

export default Router;
