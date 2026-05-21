import multer from "multer";

// Use memoryStorage so files are kept in RAM as Buffer
// This is required for serverless environments (Vercel) where the
// filesystem is read-only. The buffer is passed directly to Cloudinary.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});
