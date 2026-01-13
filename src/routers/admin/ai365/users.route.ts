import express from "express";
import { List } from "../../../controller/ai365_user.controller";

const Router = express.Router();

Router.get("/", List);

export default Router;
