require("./config/env");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDatabase = require("./config/database");
const citizenAuthRoutes = require("./modules/auth/auth.routes");
const reportRoutes = require("./modules/reports/report.routes");
const staffAuthRoutes = require("./routes/staffAuthRoutes");
const hazardWarningRoutes = require("./routes/hazardWarningRoutes");
const resourceCoordinationRoutes = require("./routes/resourceCoordinationRoutes");
const responseOperationsRoutes = require("./routes/responseOperationsRoutes");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error("Origin is not allowed by CORS");
    error.statusCode = 403;
    error.code = "CORS_ORIGIN_DENIED";
    return callback(error);
  },
}));
app.use(express.json({ limit: "32kb" }));
app.use('/uploads', express.static(require('./modules/reports/report.upload').uploadDirectory, { dotfiles: 'deny', index: false, setHeaders(res) { res.setHeader('X-Content-Type-Options', 'nosniff'); } }));

app.use("/api/auth", citizenAuthRoutes);
app.use("/api/staff/auth", staffAuthRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/health", (_req, res) => res.json({
  success: true,
  data: { status: "ok", service: "smart-disaster-management-api" },
  message: "Smart Disaster Management API is running",
}));

app.get("/api/ready", (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    data: { api: "ready", database: databaseReady ? "connected" : "disconnected" },
  });
});

app.use("/api", hazardWarningRoutes);
app.use("/api/resource-coordination", resourceCoordinationRoutes);
app.use("/api/response-operations", responseOperationsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "API route not found" },
    code: "NOT_FOUND",
    message: "API route not found",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed") {
    const message = "Request body must contain valid JSON.";
    return res.status(400).json({ success: false, error: { code: "INVALID_JSON", message }, code: "INVALID_JSON", message });
  }
  if (error.type === "entity.too.large") {
    const message = "Request body is too large.";
    return res.status(413).json({ success: false, error: { code: "PAYLOAD_TOO_LARGE", message }, code: "PAYLOAD_TOO_LARGE", message });
  }

  const statusCode = error.name === "ValidationError" || error.name === "CastError"
    ? 400
    : (error.statusCode || error.status || 500);
  const status = Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
  const controlled = Boolean(error.code && (error.statusCode || error.status));
  const code = controlled ? error.code : status < 500 ? error.code || "REQUEST_ERROR" : "INTERNAL_SERVER_ERROR";
  const message = status >= 500
    ? "An unexpected server error occurred"
    : error.message || "Unable to process the request.";

  if (status >= 500) {
    console.error("API request failed:", req.method, req.path, error.name || "Error");
    if (process.env.NODE_ENV !== "production") console.error(error.stack);
  }
  return res.status(status).json({ success: false, error: { code, message }, code, message });
});

const startServer = async () => {
  const citizenAuth = require("./modules/auth/auth.service");
  citizenAuth.assertAuthConfig();
  await connectDatabase();
  await Promise.all([
    require("./modules/auth/auth.model").init(),
    require("./modules/auth/auth.session").init(),
    require("./models/StaffUser").init(),
  ]);
  return app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Backend startup failed. Check JWT_SECRET, database settings, and Atlas network access.");
    if (process.env.NODE_ENV !== "production") console.error(error.message);
    process.exit(1);
  });
}

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
