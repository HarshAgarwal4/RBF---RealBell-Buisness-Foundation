import express from "express";
import { uploadFile } from "../../services/upload.js";
import {
  addCommunityComment,
  createCommunityPost,
  deleteCommunityPost,
  fetchCommunityPosts,
  toggleCommunityReaction,
  voteCommunityPoll,
} from "../controllers/community.js";

const communityRoutes = express.Router();

const handleCommunityUpload = (req, res, next) => {
  const uploadHandler = uploadFile.fields([
    { name: "attachment", maxCount: 1 },
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]);

  uploadHandler(req, res, (err) => {
    if (err) {
      return res.status(400).send({ status: 0, msg: err.message || "File upload failed" });
    }
    if (req.files) {
      const file =
        req.files.attachment?.[0] ||
        req.files.file?.[0] ||
        req.files.image?.[0];
      if (file) {
        req.file = file;
      }
    }
    next();
  });
};

communityRoutes.get("/", fetchCommunityPosts);
communityRoutes.post("/", handleCommunityUpload, createCommunityPost);
communityRoutes.delete("/:id", deleteCommunityPost);
communityRoutes.post("/:id/comments", addCommunityComment);
communityRoutes.post("/:id/reactions", toggleCommunityReaction);
communityRoutes.post("/:id/vote", voteCommunityPoll);

export { communityRoutes };
