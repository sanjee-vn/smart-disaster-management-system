require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const Distribution = require("../models/Distribution");
const Shelter = require("../models/Shelter");

const reset = async () => {
  try {
    await connectDatabase();
    const active = await Distribution.find({ status: { $in: ["AWAITING_ACCEPTANCE", "EN_ROUTE"] } })
      .select("distributionId")
      .lean();
    const distributionIds = active.map((item) => item.distributionId);

    if (distributionIds.length) {
      await Distribution.updateMany(
        { distributionId: { $in: distributionIds } },
        { $set: { status: "PENDING", acceptedAt: null, acceptedBy: null } },
        { runValidators: true }
      );
      await Shelter.updateMany(
        { "incomingResources.distributionId": { $in: distributionIds } },
        { $set: { "incomingResources.$[resource].status": "PENDING" } },
        { arrayFilters: [{ "resource.distributionId": { $in: distributionIds } }], runValidators: true }
      );
    }

    console.log(`Reset ${distributionIds.length} non-delivered distributions to PENDING.`);
  } finally {
    await mongoose.disconnect();
  }
};

reset().catch((error) => {
  console.error("Pending distribution reset failed:", error.message);
  process.exit(1);
});
