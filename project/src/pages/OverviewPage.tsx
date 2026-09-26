import { Link } from '@tanstack/react-router';
import {
  ScanLine, AlertTriangle, Flag, Eye, Activity, ArrowRight,
  Radar, Layers, TrendingUp, Clock,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Panel, StatCard, ConfidenceBar, Badge } from '../components/ui';
import { ANOMALY_TYPE_META, PRIORITY_META } from '../types';
import { formatCoordinates, formatDepth, timeAgo } from '../data/demo';

export function OverviewPage() {
  const { stats, recentActivity, anomalies, isStreaming } = useSession();

  const typeEntries = Object.entries(stats.typeDistribution)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const maxTypeCount = Math.max(...typeEntries.map(([, c]) => c), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mission header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-50">Mission Overview</h1>
          <p className="text-sm text-navy-400 mt-1">
            Pacific Survey Zone — Monterey Bay Deep Water Range
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800/60 border border-navy-700/40">
            <Radar className={`w-4 h-4 ${isStreaming ? 'text-cyan-400 animate-pulse' : 'text-navy-500'}`} />
            <span className="text-xs text-navy-200 font-mono">
              {isStreaming ? 'LIVE FEED' : 'FEED PAUSED'}
            </span>
          </div>
          <Link to="/analyze" className="btn-primary">
            <ScanLine className="w-4 h-4" />
            Start Analysis
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Scans"
          value={stats.totalScans}
          sublabel="survey passes completed"
          icon={<ScanLine className="w-4 h-4" />}
          accent="cyan"
        />
        <StatCard
          label="Anomalies Detected"
          value={stats.totalAnomalies}
          sublabel={`avg confidence ${Math.round(stats.avgConfidence * 100)}%`}
          icon={<AlertTriangle className="w-4 h-4" />}
          accent="amber"
        />
        <StatCard
          label="Flagged"
          value={stats.flaggedCount}
          sublabel="require review"
          icon={<Flag className="w-4 h-4" />}
          accent="coral"
        />
        <StatCard
          label="Monitoring"
          value={stats.monitoringCount}
          sublabel="under observation"
          icon={<Eye className="w-4 h-4" />}
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection distribution */}
        <Panel label="Detection Distribution" className="lg:col-span-2 p-4">
          <div className="space-y-3 mt-2">
            {typeEntries.map(([type, count]) => {
              const meta = ANOMALY_TYPE_META[type as keyof typeof ANOMALY_TYPE_META];
              const pct = (count / maxTypeCount) * 100;
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="text-xs text-navy-200">{meta.label}</span>
                  </div>
                  <div className="flex-1 h-6 bg-navy-800/40 rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${pct}%`, backgroundColor: `${meta.color}30`, borderLeft: `2px solid ${meta.color}` }}
                    >
                      <span className="text-xs font-mono text-navy-100">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Quick stats */}
        <Panel label="Survey Metrics" className="p-4">
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-navy-200">Avg Confidence</span>
              </div>
              <span className="font-mono text-lg text-navy-50">{Math.round(stats.avgConfidence * 100)}%</span>
            </div>
            <ConfidenceBar value={stats.avgConfidence} />

            <div className="flex items-center justify-between pt-2 border-t border-navy-700/40">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-navy-200">Dismissed</span>
              </div>
              <span className="font-mono text-lg text-navy-50">{stats.dismissedCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-success-400" />
                <span className="text-sm text-navy-200">Stream Status</span>
              </div>
              <span className={`font-mono text-sm ${isStreaming ? 'text-success-400' : 'text-navy-400'}`}>
                {isStreaming ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>

            <Link
              to="/anomaly-map"
              className="flex items-center justify-center gap-2 mt-4 px-4 py-2.5 rounded-lg bg-navy-800/60 border border-navy-600/40 hover:border-cyan-500/40 hover:bg-navy-700/40 transition-all group"
            >
              <span className="text-sm font-medium text-navy-100">View Anomaly Map</span>
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Panel>
      </div>

      {/* Recent activity */}
      <Panel label="Recent Survey Activity" className="p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700/40">
                <th className="text-left px-4 py-2.5 data-label">ID</th>
                <th className="text-left px-4 py-2.5 data-label">Type</th>
                <th className="text-left px-4 py-2.5 data-label hidden md:table-cell">Coordinates</th>
                <th className="text-left px-4 py-2.5 data-label hidden lg:table-cell">Depth</th>
                <th className="text-left px-4 py-2.5 data-label">Confidence</th>
                <th className="text-left px-4 py-2.5 data-label hidden md:table-cell">Priority</th>
                <th className="text-left px-4 py-2.5 data-label">Detected</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((a) => {
                const typeMeta = ANOMALY_TYPE_META[a.type];
                const priMeta = PRIORITY_META[a.priority];
                return (
                  <tr
                    key={a.id}
                    className="border-b border-navy-800/40 hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-cyan-300">{a.id}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeMeta.color }} />
                        <span className="text-xs text-navy-100">{typeMeta.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-mono text-navy-300">{formatCoordinates(a.coordinates.lat, a.coordinates.lng)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-mono text-navy-300">{formatDepth(a.coordinates.depth)}</span>
                    </td>
                    <td className="px-4 py-3 w-32">
                      <ConfidenceBar value={a.confidence} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge color={priMeta.color} bg={priMeta.bg}>{priMeta.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-navy-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(a.timestamp)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Demo notice */}
      <div className="text-center text-xs text-navy-500 pt-2">
        All detections, coordinates, and confidence scores shown above are demonstration data for prototype evaluation.
      </div>
    </div>
  );
}
