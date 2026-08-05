import express from "express";
import { uploadFile } from "../../services/upload.js";
import {
  addCommunityComment,
  createCommunityPost,
  fetchCommunityPosts,
  toggleCommunityReaction,
  voteCommunityPoll,
} from "../controllers/community.js";

const communityRoutes = express.Router();

communityRoutes.get("/", fetchCommunityPosts);
communityRoutes.post("/", uploadFile.single("image"), createCommunityPost);
communityRoutes.post("/:id/comments", addCommunityComment);
communityRoutes.post("/:id/reactions", toggleCommunityReaction);
communityRoutes.post("/:id/vote", voteCommunityPoll);

export { communityRoutes };
