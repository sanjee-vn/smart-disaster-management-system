const mongoose = require("mongoose");
require("./env");
const dns = require("node:dns");

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is required. Add it to backend/.env before starting the API.");
  if (process.env.MONGODB_DNS_SERVERS) {
    dns.setServers(process.env.MONGODB_DNS_SERVERS.split(",").map((server) => server.trim()));
  }
  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || "smart_disaster_management",
    serverSelectionTimeoutMS: 10000,
  });
  console.log("MongoDB connected");
};

module.exports = connectDatabase;
