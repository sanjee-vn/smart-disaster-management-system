const GroundReport = require("./report.model");

async function createGroundReport(data) {
  const { title, description, disasterType, latitude, longitude, citizenId, photo } = data;
  return GroundReport.create({
    title, description, disasterType, latitude, longitude, citizenId,
    photo: photo ?? null,
    status: "PENDING",
  });
}

module.exports = { createGroundReport };
