import Course from "../models/course.model.js";
import { v2 as cloudinary } from "cloudinary";

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


// ✅ Create Course (Admin)
export const createCourse = async (req, res) => {
  try {
    const { title, description, mode, duration, fee, seats } = req.body;

    let thumbnail = "";
    let thumbnailPublicId = "";

    // upload image if provided
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "ccog/courses",
      });

      thumbnail = result.secure_url;
      thumbnailPublicId = result.public_id;
    }

    const course = await Course.create({
      title,
      description,
      mode,
      duration,
      fee,
      seats,
      thumbnail,
      thumbnailPublicId,
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ✅ Get All Courses (Public)
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: "active" });

    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ✅ Get Single Course
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ✅ Update Course (Admin)
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // update image if new file uploaded
    if (req.file) {
      // delete old image from cloudinary
      if (course.thumbnailPublicId) {
        await cloudinary.uploader.destroy(course.thumbnailPublicId);
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "ccog/courses",
      });

      course.thumbnail = result.secure_url;
      course.thumbnailPublicId = result.public_id;
    }

    // update other fields
    const fields = [
      "title",
      "description",
      "mode",
      "duration",
      "fee",
      "seats",
      "status",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    await course.save();

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ✅ Delete Course (Admin)
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // delete image from cloudinary
    if (course.thumbnailPublicId) {
      await cloudinary.uploader.destroy(course.thumbnailPublicId);
    }

    await course.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};