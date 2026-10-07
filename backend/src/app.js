require("./config/env");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDatabase = require("./config/database");
const resourceCoordinationRoutes = require("./routes/resourceCoordinationRoutes");
const hazardWarningRoutes = require("./routes/hazardWarningRoutes");

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

app.get("/api/health", (req, res) => res.json({
  success: true,
  data: { status: "ok", service: "smart-disaster-management-api" },
}));

app.get("/api/ready", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    data: { api: "ready", database: databaseReady ? "connected" : "disconnected" },
  });
});

app.use("/api", hazardWarningRoutes);
app.use("/api/resource-coordination", resourceCoordinationRoutes);

app.use((req, res) => res.status(404).json({
  success: false,
  error: { code: "NOT_FOUND", message: "The requested API endpoint does not exist" },
}));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const isClientError = error.statusCode || error.status;
  const status = error.name === "ValidationError" || error.name === "CastError"
    ? 400
    : (isClientError || 500);
  if (status >= 500) console.error("API request failed:", error.name || "Error");
  const message = status >= 500 ? "An unexpected server error occurred" : error.message;
  return res.status(status).json({
    success: false,
    error: { code: error.code || "REQUEST_FAILED", message },
  });
});

const startServer = async () => {
  await connectDatabase();
  return app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start server:", error.name || "Error");
    process.exit(1);
  });
}

module.exports = { app, startServer };
