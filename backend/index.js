import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import connectCloudinary from "./config/cloudinary.js";
import courseRoutes from "./routes/course.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import documentRoutes from "./routes/document.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import stripeWebhookRoutes from "./routes/stripeWebhook.routes.js";
dotenv.config();

const app = express();
connectDB();
connectCloudinary();
app.use("/api/webhooks", stripeWebhookRoutes);
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/payments", paymentRoutes);

// Export app for serverless environments (Vercel)
export default app;

// Only start the HTTP server when running directly (not in serverless)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
