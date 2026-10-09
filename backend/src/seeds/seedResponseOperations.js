require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const Warning = require("../models/Warning");
const Incident = require("../models/Incident");
const Agency = require("../models/Agency");
const ResponseTeam = require("../models/ResponseTeam");
const ResponseAssignment = require("../models/ResponseAssignment");

const agencies = [
  { name: "Disaster Management Centre", type: "DMC", contact: "+94 11 213 6222", status: "ACTIVE" },
  { name: "Sri Lanka Police", type: "POLICE", contact: "119", status: "ACTIVE" },
  { name: "Sri Lanka Army", type: "ARMED_FORCES", contact: "+94 11 243 2682", status: "ACTIVE" },
  { name: "Fire & Rescue Service", type: "FIRE_RESCUE", contact: "110", status: "ACTIVE" },
  { name: "Ministry of Health", type: "MEDICAL", contact: "1999", status: "ACTIVE" },
  { name: "Sri Lanka Red Cross", type: "NGO", contact: "+94 11 269 1095", status: "ACTIVE" },
];

const teams = [
  { name: "DMC Coordination Team-01", agency: "Disaster Management Centre", type: "Coordination", currentLocation: "DMC Colombo Operations Centre", capacity: 8, status: "AVAILABLE" },
  { name: "Police Rescue Unit-01", agency: "Sri Lanka Police", type: "Search and Rescue", currentLocation: "Colombo Central Police Station", capacity: 12, status: "AVAILABLE" },
  { name: "Army Rescue Team-01", agency: "Sri Lanka Army", type: "Heavy Rescue", currentLocation: "Panagoda Army Cantonment", capacity: 20, status: "AVAILABLE" },
  { name: "Fire & Rescue Team-01", agency: "Fire & Rescue Service", type: "Flood Rescue", currentLocation: "Colombo Fire Station", capacity: 10, status: "AVAILABLE" },
  { name: "Medical Emergency Team-01", agency: "Ministry of Health", type: "Emergency Medical", currentLocation: "National Hospital Colombo", capacity: 7, status: "AVAILABLE" },
  { name: "Red Cross Volunteer Team-01", agency: "Sri Lanka Red Cross", type: "Volunteer Relief", currentLocation: "Red Cross Colombo Branch", capacity: 15, status: "AVAILABLE" },
  { name: "Police Field Response Unit-02", agency: "Sri Lanka Police", type: "Police Emergency Response", currentLocation: "Colombo Central Police Station", capacity: 30, status: "AVAILABLE" },
  { name: "Fire & Rescue Team-02", agency: "Fire & Rescue Service", type: "Fire Rescue", currentLocation: "Colombo Fire Station", capacity: 15, status: "AVAILABLE" },
  { name: "Medical Emergency Team-02", agency: "Ministry of Health", type: "Emergency Medical", currentLocation: "National Hospital Colombo", capacity: 40, status: "AVAILABLE" },
  { name: "Army Emergency Response Team-02", agency: "Sri Lanka Army", type: "Armed Forces Emergency Response", currentLocation: "Panagoda Army Cantonment", capacity: 40, status: "AVAILABLE" },
  { name: "Colombo Police District Task Force-03", agency: "Sri Lanka Police", type: "Police District Emergency Response", currentLocation: "Colombo District Operations Centre", capacity: 100, status: "AVAILABLE" },
  { name: "Army Operational Support Team-03", agency: "Sri Lanka Army", type: "Armed Forces Operational Support", currentLocation: "Panagoda Army Cantonment", capacity: 45, status: "AVAILABLE" },
  { name: "Kandy Police Emergency Unit-04", agency: "Sri Lanka Police", type: "Police Emergency Response", currentLocation: "Kandy Police Headquarters", capacity: 35, status: "AVAILABLE" },
  { name: "Kandy Fire & Rescue Unit-03", agency: "Fire & Rescue Service", type: "Fire Rescue", currentLocation: "Kandy Fire Brigade", capacity: 40, status: "AVAILABLE" },
];

const seed = async () => {
  try {
    await connectDatabase();
    const now = new Date();
    const warning = await Warning.findOne({ warningId: "WRN-2026-COLOMBO-FLOOD-01" }).lean();
    const incident = await Incident.findOneAndUpdate(
      { incidentId: "INC-2026-COLOMBO-FLOOD-01" },
      { $setOnInsert: { incidentId: "INC-2026-COLOMBO-FLOOD-01", warningId: warning?._id || null, hazardType: "Flood", severity: "EMERGENCY", district: "Colombo", affectedArea: "Colombo District", affectedPopulation: 18500, status: "ACTIVE", createdAt: now } },
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    for (const agency of agencies) {
      await Agency.findOneAndUpdate({ name: agency.name }, { $setOnInsert: agency }, { upsert: true, returnDocument: "after", runValidators: true });
    }
    const agencyRecords = await Agency.find({ name: { $in: agencies.map(({ name }) => name) } }).lean();
    const agencyByName = new Map(agencyRecords.map((agency) => [agency.name, agency._id]));

    for (const { agency, status: _status, ...team } of teams) {
      await ResponseTeam.findOneAndUpdate(
        { name: team.name },
        { $setOnInsert: { ...team, agencyId: agencyByName.get(agency) }, $set: { status: "AVAILABLE" } },
        { upsert: true, returnDocument: "after", runValidators: true }
      );
    }
    await ResponseTeam.updateMany({}, { $set: { status: "AVAILABLE" } });
    const plannedTeamNames = ["DMC Coordination Team-01", "Army Rescue Team-01", "Medical Emergency Team-01"];
    const plannedTeams = await ResponseTeam.find({ name: { $in: plannedTeamNames } }).lean();
    await ResponseAssignment.findOneAndUpdate(
      { responseId: "RSP-2026-COLOMBO-FLOOD-01" },
      {
        $setOnInsert: { responseId: "RSP-2026-COLOMBO-FLOOD-01", incidentId: incident._id, teamIds: plannedTeams.map((team) => team._id), priority: "CRITICAL", destination: "Colombo District Flood Zone", instructions: "Stage teams for coordinated flood response. Do not dispatch until authorized.", status: "PLANNED", eta: new Date(now.getTime() + 90 * 60 * 1000), createdAt: now },
        $addToSet: { requiredCapabilities: { $each: ["SHELTER", "EVACUATION", "FOOD", "WATER", "MEDICINE"] } },
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    console.log(`Seeded integrated response workflow: 1 warning, 1 incident, ${agencies.length} agencies, ${teams.length} teams, 1 planned assignment`);
  } finally {
    await mongoose.disconnect();
  }
};

seed().catch((error) => {
  console.error("Response operations seed failed:", error.message);
  process.exit(1);
});
