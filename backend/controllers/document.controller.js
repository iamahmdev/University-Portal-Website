import { v2 as cloudinary } from "cloudinary";

import Document from "../models/document.model.js";
import Application from "../models/application.model.js";


// Upload a buffer directly to Cloudinary (works with memoryStorage)
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
};


// ✅ Student uploads a document for an application
export const uploadDocument = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { applicationId } = req.params;
    const { type } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    const allowedTypes = [
      "passport",
      "photo",
      "transcript",
      "id_card",
      "certificate",
      "resume",
      "other",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    const application = await Application.findById(applicationId);

    if (!application) {
      await removeLocalFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // student can upload only for own application
    if (application.studentId.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to upload documents for this application",
      });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "ccog/documents",
      resource_type: "auto",
    });

    const document = await Document.create({
      studentId,
      applicationId,
      type,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname || "",
      format: result.format || "",
      size: req.file.size || 0,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ✅ Student gets all documents of own application
export const getMyApplicationDocuments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.studentId.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view these documents",
      });
    }

    const documents = await Document.find({ applicationId, studentId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      documents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ✅ Admin gets all documents for any application
export const getDocumentsByApplicationAdmin = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const documents = await Document.find({ applicationId })
      .populate("studentId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      documents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ✅ Admin updates document status
export const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const allowedStatuses = ["approved", "rejected", "pending"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document status",
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    document.status = status;
    document.remarks = remarks || "";
    document.verifiedBy = req.user.email || req.user.id || "admin";
    document.verifiedAt = new Date();

    await document.save();

    return res.status(200).json({
      success: true,
      message: "Document status updated successfully",
      document,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ✅ Student/Admin delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = document.studentId.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this document",
      });
    }

    if (document.publicId) {
      await cloudinary.uploader.destroy(document.publicId, {
        resource_type: "auto",
      });
    }

    await document.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};