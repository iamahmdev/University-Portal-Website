import express from "express";
import { upload } from "../config/multer.js";

import {
  uploadDocument,
  getMyApplicationDocuments,
  getDocumentsByApplicationAdmin,
  updateDocumentStatus,
  deleteDocument,
} from "../controllers/document.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";

const router = express.Router();
// Student routes
router.post(
  "/upload/:applicationId",
  protect,
  upload.single("file"),
  uploadDocument
);

router.get(
  "/my/:applicationId",
  protect,
  getMyApplicationDocuments
);

router.delete(
  "/:id",
  protect,
  deleteDocument
);


// Admin routes
router.get(
  "/admin/application/:applicationId",
  protect,
  adminOnly,
  getDocumentsByApplicationAdmin
);

router.put(
  "/admin/:id/status",
  protect,
  adminOnly,
  updateDocumentStatus
);

export default router;