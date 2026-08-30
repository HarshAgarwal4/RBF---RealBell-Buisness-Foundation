import express from "express";
import { uploadFile } from "../../services/upload.js";
import { requireSubscription } from "../../middlewares/subscriptionGuard.js";
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

/* View posts (public/member reading) */
communityRoutes.get("/", fetchCommunityPosts);

/* Interactive actions (strictly protected by backend subscription guard) */
communityRoutes.post("/", requireSubscription("community"), handleCommunityUpload, createCommunityPost);
communityRoutes.delete("/:id", requireSubscription("community"), deleteCommunityPost);
communityRoutes.post("/:id/comments", requireSubscription("community"), addCommunityComment);
communityRoutes.post("/:id/reactions", requireSubscription("community"), toggleCommunityReaction);
communityRoutes.post("/:id/vote", requireSubscription("community"), voteCommunityPoll);

export { communityRoutes };
