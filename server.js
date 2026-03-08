const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const studentRoutes = require("./routes/studentRoutes");
const companyRoutes = require("./routes/companyRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileViewRoutes = require("./routes/profileViewRoutes");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const normalizeOrigin = (origin = "") => origin.trim().replace(/\/+$/, "");

const allowedOrigins = [
  process.env.CORS_ORIGINS,
  process.env.FRONTEND_URL,
  "https://placement-dashboard-frontend-3jur.vercel.app,http://localhost:5173,http://localhost:5174,http://localhost:300",
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map(normalizeOrigin)
  .filter(Boolean)
  .filter((origin, index, origins) => origins.indexOf(origin) === index);

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!origin || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS origin: ${origin}`);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/profile-views", profileViewRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
