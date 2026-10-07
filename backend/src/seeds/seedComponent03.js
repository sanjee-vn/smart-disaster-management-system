require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const ResourceOwner = require("../models/ResourceOwner");
const InventoryItem = require("../models/InventoryItem");
const DeliveryResource = require("../models/DeliveryResource");

const ownerSeeds = [
  { name: "Government Central Warehouse", type: "GOVERNMENT" },
  { name: "Red Cross NGO", type: "NGO" },
  { name: "Armed Forces Logistics Unit", type: "ARMED_FORCES" },
];

const inventorySeeds = [
  { category: "Water", itemName: "Water 1L", ownerName: "Government Central Warehouse", availableQuantity: 1000, unit: "bottles", status: "ACTIVE" },
  { category: "Water", itemName: "Water 1L", ownerName: "Red Cross NGO", availableQuantity: 500, unit: "bottles", status: "ACTIVE" },
  { category: "Food", itemName: "Food Pack", ownerName: "Government Central Warehouse", availableQuantity: 700, unit: "packs", status: "ACTIVE" },
  { category: "Food", itemName: "Dry Ration Pack", ownerName: "Red Cross NGO", availableQuantity: 450, unit: "packs", status: "ACTIVE" },
  { category: "Medicine", itemName: "Medicine Kit", ownerName: "Armed Forces Logistics Unit", availableQuantity: 300, unit: "kits", status: "ACTIVE" },
  { category: "Medicine", itemName: "First Aid Pack", ownerName: "Government Central Warehouse", availableQuantity: 200, unit: "packs", status: "ACTIVE" },
];

const deliverySeeds = [
  { name: "Truck-01", type: "Truck", status: "AVAILABLE", currentLocation: "Colombo Central Warehouse" },
  { name: "Truck-02", type: "Truck", status: "IN_USE", currentLocation: "Kolonnawa Relief Route" },
  { name: "Van-01", type: "Van", status: "AVAILABLE", currentLocation: "Colombo District Secretariat" },
  { name: "Rescue Logistics Team-01", type: "Team", status: "AVAILABLE", currentLocation: "DMC Colombo Operations Centre" },
];

const seed = async () => {
  try {
    await connectDatabase();
    for (const owner of ownerSeeds) {
      await ResourceOwner.findOneAndUpdate({ name: owner.name }, owner, { upsert: true, returnDocument: "after", runValidators: true });
    }
    const owners = await ResourceOwner.find({ name: { $in: ownerSeeds.map(({ name }) => name) } }).lean();
    const ownerByName = new Map(owners.map((owner) => [owner.name, owner._id]));

    for (const { ownerName, ...item } of inventorySeeds) {
      const ownerId = ownerByName.get(ownerName);
      await InventoryItem.findOneAndUpdate(
        { category: item.category, itemName: item.itemName, ownerId },
        { ...item, ownerId },
        { upsert: true, returnDocument: "after", runValidators: true }
      );
    }
    for (const resource of deliverySeeds) {
      await DeliveryResource.findOneAndUpdate({ name: resource.name }, resource, { upsert: true, returnDocument: "after", runValidators: true });
    }
    console.log(`Seeded Component 03: ${ownerSeeds.length} owners, ${inventorySeeds.length} inventory records, ${deliverySeeds.length} delivery resources`);
  } finally {
    await mongoose.disconnect();
  }
};

seed().catch((error) => {
  console.error("Component 03 seed failed:", error.message);
  process.exit(1);
});
