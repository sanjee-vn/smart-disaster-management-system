require("../config/env");
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const Shelter = require("../models/Shelter");

const incidentId = "INC-2026-COLOMBO-FLOOD-01";
const shelters = [
  {
    shelterId: "SHT-2026-COLOMBO-ALPHA",
    name: "Shelter Alpha - Royal College Hall", district: "Colombo", incidentId,
    occupancy: 286, capacity: 350, status: "Operational",
    pendingRequests: [
      { item: "Drinking water", quantity: 800, unit: "bottles", priority: "High" },
      { item: "Hygiene kits", quantity: 120, unit: "kits", priority: "Medium" },
    ],
    incomingResources: [
      { item: "Rice meal packs", quantity: 400, unit: "packs", owner: "Colombo DMC", deliveryResource: "Truck CMB-14", status: "In Transit", eta: new Date("2026-10-07T11:30:00+05:30") },
      { item: "Drinking water", quantity: 500, unit: "bottles", owner: "Sri Lanka Red Cross", deliveryResource: "Van RC-08", status: "Scheduled", eta: new Date("2026-10-07T14:00:00+05:30") },
    ],
  },
  {
    shelterId: "SHT-2026-COLOMBO-BETA",
    name: "Shelter Beta - Kolonnawa Community Centre", district: "Colombo", incidentId,
    occupancy: 178, capacity: 200, status: "Near Capacity",
    pendingRequests: [
      { item: "Sleeping mats", quantity: 80, unit: "mats", priority: "Critical" },
      { item: "Infant formula", quantity: 30, unit: "tins", priority: "High" },
      { item: "First aid kits", quantity: 12, unit: "kits", priority: "High" },
    ],
    incomingResources: [
      { item: "Sleeping mats", quantity: 50, unit: "mats", owner: "District Secretariat", deliveryResource: "Lorry DS-22", status: "Delayed", eta: new Date("2026-10-07T16:45:00+05:30") },
    ],
  },
  {
    shelterId: "SHT-2026-COLOMBO-GAMMA",
    name: "Shelter Gamma - Homagama Maha Vidyalaya", district: "Colombo", incidentId,
    occupancy: 94, capacity: 250, status: "Operational", pendingRequests: [],
    incomingResources: [
      { item: "Blankets", quantity: 120, unit: "blankets", owner: "National Relief Services Centre", deliveryResource: "Truck NRS-05", status: "In Transit", eta: new Date("2026-10-07T12:15:00+05:30") },
      { item: "Medical supplies", quantity: 20, unit: "boxes", owner: "Ministry of Health", deliveryResource: "Ambulance MH-17", status: "Scheduled", eta: new Date("2026-10-07T15:30:00+05:30") },
    ],
  },
];

const seed = async () => {
  try {
    await connectDatabase();
    for (const shelter of shelters) {
      const existing = await Shelter.findOne({
        incidentId,
        $or: [{ shelterId: shelter.shelterId }, { name: shelter.name }],
      }).select("_id");
      await Shelter.findOneAndUpdate(
        existing ? { _id: existing._id } : { incidentId, shelterId: shelter.shelterId },
        { $set: shelter },
        { upsert: true, returnDocument: "after", runValidators: true }
      );
    }
    console.log(`Upserted ${shelters.length} stable shelters for ${incidentId}`);
  } finally {
    await mongoose.disconnect();
  }
};

seed().catch((error) => {
  console.error("Shelter seed failed:", error.name || "Error");
  process.exit(1);
});
