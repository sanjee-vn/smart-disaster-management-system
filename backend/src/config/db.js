const mongoose = require("mongoose");
const dns = require("node:dns");

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  if (process.env.MONGODB_DNS_SERVERS) {
    dns.setServers(process.env.MONGODB_DNS_SERVERS.split(",").map(server => server.trim()));
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || "smart_disaster_management",
    serverSelectionTimeoutMS: 10000,
  });
  console.log("MongoDB connected");
}

module.exports = connectDB;
