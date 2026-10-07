require("../config/env");

const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const Hazard = require("../models/Hazard");

const hazards = [
  { hazardId: "HZ-2024-001", type: "Heavy Rainfall", district: "Colombo", severity: "High", status: "Monitoring", population: "18,400", confidence: "High", description: "Persistent heavy rainfall is raising water levels across low-lying areas. Field teams are monitoring drainage and river conditions.", source: "Department of Meteorology", ds: "Colombo", location: "6.9271 N, 79.8612 E" },
  { hazardId: "HZ-2024-002", type: "Flood", district: "Gampaha", severity: "High", status: "Active", population: "25,000+", confidence: "High", description: "River levels have risen following sustained rainfall. Residents in flood-prone communities should prepare to move to higher ground.", source: "River Gauge Network", ds: "Gampaha", location: "7.0917 N, 79.9997 E" },
  { hazardId: "HZ-2024-003", type: "Landslide Risk", district: "Kandy", severity: "Medium", status: "Monitoring", population: "8,250", confidence: "Medium", description: "Soil saturation is increasing on steep slopes. Local authorities have been notified to monitor vulnerable settlements.", source: "National Building Research Organisation", ds: "Kandy", location: "7.2906 N, 80.6337 E" },
  { hazardId: "HZ-2024-004", type: "Strong Winds", district: "Galle", severity: "Medium", status: "Active", population: "12,600", confidence: "High", description: "Strong coastal winds are expected this afternoon. Fisher communities and coastal residents should follow local advisories.", source: "Department of Meteorology", ds: "Galle", location: "6.0535 N, 80.2212 E" },
  { hazardId: "HZ-2024-005", type: "Coastal Surge", district: "Matara", severity: "High", status: "Warning Issued", population: "31,200", confidence: "High", description: "Coastal water levels may rise during high tide. Keep clear of exposed shorelines and follow instructions from local officials.", source: "Coast Conservation Department", ds: "Matara", location: "5.9549 N, 80.5550 E" },
  { hazardId: "HZ-2024-006", type: "Heavy Rainfall", district: "Ratnapura", severity: "Low", status: "Monitoring", population: "5,800", confidence: "Medium", description: "Showers are continuing across the district. Monitoring stations report stable river levels at this time.", source: "Department of Meteorology", ds: "Ratnapura", location: "6.6828 N, 80.3992 E" },
  { hazardId: "HZ-2024-007", type: "Landslide Risk", district: "Nuwara Eliya", severity: "Medium", status: "Active", population: "7,100", confidence: "Medium", description: "Ground movement sensors have detected elevated activity. Avoid unstable slopes and heed local authority guidance.", source: "NBRO Sensor Network", ds: "Nuwara Eliya", location: "6.9497 N, 80.7891 E" },
  { hazardId: "HZ-2024-008", type: "Flash Flood", district: "Kalutara", severity: "High", status: "Pending", population: "14,700", confidence: "High", description: "Rapid rainfall may cause flash flooding near streams and low crossings. Do not attempt to cross moving water.", source: "Local Authority Report", ds: "Kalutara", location: "6.5854 N, 79.9607 E" },
  { hazardId: "HZ-2024-009", type: "Strong Winds", district: "Trincomalee", severity: "Medium", status: "Monitoring", population: "9,400", confidence: "Medium", description: "Gusty conditions are forecast for the eastern coast. Small craft should remain in harbour until conditions improve.", source: "Department of Meteorology", ds: "Trincomalee", location: "8.5874 N, 81.2152 E" },
  { hazardId: "HZ-2024-010", type: "Heavy Rainfall", district: "Batticaloa", severity: "Low", status: "Active", population: "6,300", confidence: "Medium", description: "Localised rain showers are being tracked. No immediate threat to populated areas has been identified.", source: "Department of Meteorology", ds: "Batticaloa", location: "7.7310 N, 81.6747 E" },
];

const seedHazards = async () => {
  try {
    await connectDatabase();
    await Hazard.bulkWrite(hazards.map((hazard) => ({
      updateOne: {
        filter: { hazardId: hazard.hazardId },
        update: { $setOnInsert: { ...hazard, reportedAt: new Date() } },
        upsert: true,
      },
    })), { ordered: true });
    console.log(`Seed completed for ${hazards.length} hazard IDs; existing records were preserved.`);
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
};

seedHazards().catch((error) => {
  console.error("Hazard seed failed:", error.name || "Error");
  process.exitCode = 1;
});
