import express from "express";
import {
  getPublicPageContent,
  getAllPublicPages,
} from "../controllers/frontendCustomizerController.js";

const pageContentRouter = express.Router();

pageContentRouter.get("/", getAllPublicPages);
pageContentRouter.get("/:pageKey", getPublicPageContent);

export default pageContentRouter;
