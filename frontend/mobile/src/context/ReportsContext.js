import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createReportCache } from '../services/reportCache.cjs';
import { mergeReports } from '../utils/reports.cjs';

const ReportsContext = createContext(null);
export function ReportsProvider({ children, userId }) {
  const cache = useMemo(() => createReportCache(AsyncStorage, userId || 'signed-out'), [userId]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await cache.load();
      setReports(current => mergeReports(stored, current));
      setStorageError('');
    } catch {
      setStorageError('Saved reports could not be loaded from this device. You can retry; reports from this session remain available.');
    } finally { setLoading(false); }
  }, [cache]);
  useEffect(() => {
    let active = true;
    cache.load().then(stored => {
      if (active) setReports(current => mergeReports(stored, current));
    }).catch(() => {
      if (active) setStorageError('Saved reports could not be loaded from this device. You can retry; reports from this session remain available.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cache]);
  const recordReport = useCallback(async report => {
    setReports(current => mergeReports(current, [report]));
    try {
      await cache.save(report);
      setStorageError('');
    } catch {
      setStorageError('Your report was submitted, but this device could not save its receipt. Keep the report reference before closing the app.');
    }
  }, [cache]);
  const mine = useMemo(() => reports.filter(report => report.citizenId === userId), [reports, userId]);
  return <ReportsContext.Provider value={{ reports: mine, loading, storageError, reload, recordReport }}>{children}</ReportsContext.Provider>;
}
export function useReports() {
  const context = useContext(ReportsContext);
  if (!context) throw new Error('ReportsProvider is required');
  return context;
}
