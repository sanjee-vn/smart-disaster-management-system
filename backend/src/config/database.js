const mongoose = require("mongoose");

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_disaster_management";
  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || "smart_disaster_management",
    serverSelectionTimeoutMS: 10000,
  });
  console.log("MongoDB connected");
};

module.exports = connectDatabase;
