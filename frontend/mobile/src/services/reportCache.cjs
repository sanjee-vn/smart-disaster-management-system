const { mergeReports } = require('../utils/reports.cjs');
const CACHE_KEY = 'disaster-connect:submitted-reports:v1';

// Device receipts, not an authoritative source of server-side verification updates.
function createReportCache(storage, ownerId) {
  const key = ownerId ? `${CACHE_KEY}:${ownerId}` : CACHE_KEY;
  let queue = Promise.resolve();
  async function load() {
    const text = await storage.getItem(key);
    if (!text) return [];
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Invalid report cache');
    return mergeReports([], parsed).filter(report => !ownerId || report.citizenId === ownerId);
  }
  function save(report) {
    const operation = queue.catch(() => {}).then(async () => {
      const current = await load();
      const reports = mergeReports(current, [report]).filter(item => !ownerId || item.citizenId === ownerId);
      await storage.setItem(key, JSON.stringify(reports));
      return reports;
    });
    queue = operation;
    return operation;
  }
  return { load, save };
}
module.exports = { createReportCache, CACHE_KEY };
