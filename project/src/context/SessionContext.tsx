import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type { Anomaly, SessionStats } from '../types';
import { generateInitialAnomalies, generateStreamedAnomaly, computeStats } from '../data/demo';

interface SessionContextValue {
  anomalies: Anomaly[];
  stats: SessionStats;
  isStreaming: boolean;
  toggleStreaming: () => void;
  addAnomaly: (a: Anomaly) => void;
  recentActivity: Anomaly[];
  streamProgress: number;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>(() => generateInitialAnomalies(24));
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamProgress, setStreamProgress] = useState(0);
  const counterRef = useRef(25);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addAnomaly = useCallback((a: Anomaly) => {
    setAnomalies((prev) => [a, ...prev].slice(0, 200));
  }, []);

  useEffect(() => {
    if (isStreaming) {
      intervalRef.current = setInterval(() => {
        const a = generateStreamedAnomaly(counterRef.current++);
        addAnomaly(a);
      }, 6000);

      progressRef.current = setInterval(() => {
        setStreamProgress((p) => (p >= 100 ? 0 : p + 2));
      }, 120);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isStreaming, addAnomaly]);

  const toggleStreaming = useCallback(() => setIsStreaming((s) => !s), []);

  const stats = computeStats(anomalies);
  const recentActivity = anomalies.slice(0, 8);

  return (
    <SessionContext.Provider
      value={{ anomalies, stats, isStreaming, toggleStreaming, addAnomaly, recentActivity, streamProgress }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
