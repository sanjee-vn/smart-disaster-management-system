import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadOperationalUpdates } from '../services/operationalUpdates';

const empty = { requests: [], incidents: [], allIncidents: [], assignments: [], distributions: [] };

export default function useOperationalUpdates() {
  const [state, setState] = useState({ loading: true, refreshing: false, error: '', ...empty });
  const load = useCallback(async (refreshing = false) => {
    setState(current => ({ ...current, loading: !refreshing, refreshing, error: '' }));
    try {
      const data = await loadOperationalUpdates();
      setState({ loading: false, refreshing: false, error: '', ...empty, ...data });
    } catch (error) {
      setState(current => ({ ...current, loading: false, refreshing: false, error: error.response?.data?.error?.message || error.response?.data?.message || 'Unable to load operational updates.' }));
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); const timer = setInterval(() => { void load(true); }, 10000); return () => clearInterval(timer); }, [load]));
  return { ...state, retry: () => load(true) };
}
