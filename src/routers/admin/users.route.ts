import express from "express";
import { Create, List, Delete, Update } from "../../controller/user.controller";

const Router = express.Router();

Router.get("/", List);
Router.post("/", Create);
Router.delete("/:id", Delete);
Router.put("/:id", Update);

export default Router;
