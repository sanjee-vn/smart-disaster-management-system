const assert = require("node:assert/strict");
const repository = require("../src/repositories/responseOperationsRepository");
const service = require("../src/services/responseOperationsService");

const teamId = "507f1f77bcf86cd799439011";
const deployed = { _id: teamId, name: "Fire Team", type: "Fire Rescue", capacity: 30, status: "DEPLOYED", agencyId: null };
const available = { ...deployed, status: "AVAILABLE" };

async function main() {
  const originalFind = repository.findTeamById;
  const originalRelease = repository.releaseDeployedTeam;
  try {
    let reads = 0;
    repository.findTeamById = async () => (++reads === 1 ? deployed : available);
    repository.releaseDeployedTeam = async () => available;
    const result = await service.markTeamAvailable(teamId);
    assert.equal(result.status, "AVAILABLE");

    repository.findTeamById = async () => available;
    await assert.rejects(() => service.markTeamAvailable(teamId), (error) => error.code === "TEAM_NOT_DEPLOYED" && error.status === 409);
    await assert.rejects(() => service.markTeamAvailable("invalid"), (error) => error.code === "RESPONSE_TEAM_NOT_FOUND" && error.status === 404);
    console.log("Response team availability tests passed: only DEPLOYED teams transition to AVAILABLE.");
  } finally {
    repository.findTeamById = originalFind;
    repository.releaseDeployedTeam = originalRelease;
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
