const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const connectDB = require("./config/db");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use("/api/reports", require("./modules/reports/report.routes"));

app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body must contain valid JSON." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large." });
  }
  return res.status(500).json({ success: false, message: "Unable to process the request." });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Smart Disaster Management API is running"
  });
});

async function startServer() {
  try {
    require('./modules/auth/auth.service').assertAuthConfig();
    await connectDB();
    await Promise.all([
      require('./modules/auth/auth.model').init(),
      require('./modules/auth/auth.session').init(),
    ]);
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    server.on("error", () => {
      console.error("Server failed to start. Check the port configuration.");
      process.exit(1);
    });
  } catch {
    console.error("Backend startup failed. Check JWT_SECRET, database settings, and Atlas network access.");
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
