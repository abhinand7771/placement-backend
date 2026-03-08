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
const allowAllLocalOrigins = process.env.CORS_ALLOW_ALL_LOCAL !== "false";

const normalizeOrigin = (origin = "") => origin.trim().replace(/\/+$/, "");

const getOriginUrl = (origin) => {
  try {
    return new URL(origin);
  } catch {
    return null;
  }
};

const isLoopbackHost = (hostname = "") =>
  ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);

const isPrivateIpv4Host = (hostname = "") => {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
};

const isLocalDevOrigin = (origin) => {
  const parsed = getOriginUrl(origin);
  if (!parsed) return false;

  return (
    (parsed.protocol === "http:" || parsed.protocol === "https:") &&
    (isLoopbackHost(parsed.hostname) ||
      (allowAllLocalOrigins && isPrivateIpv4Host(parsed.hostname)))
  );
};

const allowedOrigins = [
  process.env.CORS_ORIGINS,
  "http://localhost:5173,http://localhost:5174,http://localhost:3000,https://placement-dashboard-frontend-dev.vercel.app",
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map(normalizeOrigin)
  .filter(Boolean)
  .filter((origin, index, origins) => origins.indexOf(origin) === index);

const isAllowedOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  return (
    !origin ||
    allowedOrigins.includes(normalizedOrigin) ||
    isLocalDevOrigin(normalizedOrigin)
  );
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS origin: ${origin}`);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test/cors", (req, res) => {
  const requestOrigin = normalizeOrigin(req.get("origin") || "");
  res.status(200).json({
    ok: true,
    message: "CORS test endpoint is reachable",
    origin: requestOrigin || null,
    origin_allowed: isAllowedOrigin(requestOrigin),
    allow_all_local_origins: allowAllLocalOrigins,
    configured_origins: allowedOrigins,
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
  console.log(`CORS local-dev mode: ${allowAllLocalOrigins ? "enabled" : "disabled"}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(", ") || "(none)"}`);
  console.log(`Server running at http://localhost:${PORT}`);
});
