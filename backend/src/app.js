const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDatabase = require("./config/database");
const resourceCoordinationRoutes = require("./routes/resourceCoordinationRoutes");
const responseOperationsRoutes = require("./routes/responseOperationsRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Smart Disaster Management API is running"
  });
});

app.use("/api/resource-coordination", resourceCoordinationRoutes);
app.use("/api/response-operations", responseOperationsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "API route not found" },
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "An unexpected server error occurred",
  });
});

const startServer = async () => {
  await connectDatabase();
  return app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
