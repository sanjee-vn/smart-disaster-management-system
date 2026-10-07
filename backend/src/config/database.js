const mongoose = require("mongoose");
require("./env");

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is required. Add it to backend/.env before starting the API.");
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log("MongoDB connected");
};

module.exports = connectDatabase;
