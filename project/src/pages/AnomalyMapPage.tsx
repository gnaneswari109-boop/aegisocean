import { useState, useMemo, useCallback } from 'react';
import {
  Filter, RotateCcw, Download, FileText, FileJson,
  Crosshair, Layers, MapPin, Clock, Activity, Box, Map as MapIcon,
  Focus, Radio, Zap,
} from 'lucide-react';
import { Panel, Badge, ConfidenceBar } from '../components/ui';
import { Seafloor3D } from '../components/Seafloor3D';
import { WorldMap } from '../components/WorldMap';
import { useSession } from '../context/SessionContext';
import { ANOMALY_TYPE_META, PRIORITY_META } from '../types';
import type { AnomalyType, Priority } from '../types';
import { formatCoordinates, formatLat, formatLng, formatDepth, formatTimestamp, timeAgo } from '../data/demo';
import { downloadFile, anomaliesToCSV, anomaliesToJSON } from '../data/downloads';

type ViewMode = '3d' | '2d';

export function AnomalyMapPage() {
  const { anomalies, isStreaming } = useSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');

  // Filters
  const [typeFilter, setTypeFilter] = useState<Set<AnomalyType>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(new Set());
  const [minConfidence, setMinConfidence] = useState(0);
  const [maxDepth, setMaxDepth] = useState(5000);

  const toggleType = useCallback((type: AnomalyType) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const togglePriority = useCallback((p: Priority) => {
    setPriorityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }, []);

  const resetFilters = () => {
    setTypeFilter(new Set());
    setPriorityFilter(new Set());
    setMinConfidence(0);
    setMaxDepth(5000);
  };

  const resetView = () => {
    setResetTrigger((t) => t + 1);
    setSelectedId(null);
  };

  const filtered = useMemo(() => {
    return anomalies.filter((a) => {
      if (typeFilter.size > 0 && !typeFilter.has(a.type)) return false;
      if (priorityFilter.size > 0 && !priorityFilter.has(a.priority)) return false;
      if (a.confidence < minConfidence / 100) return false;
      if (a.coordinates.depth > maxDepth) return false;
      return true;
    });
  }, [anomalies, typeFilter, priorityFilter, minConfidence, maxDepth]);

  const selected = filtered.find((a) => a.id === selectedId) || null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleFocus = useCallback(() => {
    if (selectedId) {
      setFocusTrigger((t) => t + 1);
    }
  }, [selectedId]);

  const downloadCSV = () => {
    downloadFile(anomaliesToCSV(filtered), `aegisocean-map-export-${Date.now()}.csv`, 'text/csv');
  };

  const downloadJSON = () => {
    downloadFile(anomaliesToJSON(filtered), `aegisocean-map-export-${Date.now()}.json`, 'application/json');
  };

  const hasActiveFilters = typeFilter.size > 0 || priorityFilter.size > 0 || minConfidence > 0 || maxDepth < 5000;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-50">Anomaly Map</h1>
          <p className="text-sm text-navy-400 mt-1">
            Side-Scan Sonar anomaly visualization — {filtered.length} of {anomalies.length} detections shown
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 2D / 3D toggle */}
          <div className="flex items-center gap-1 bg-navy-800/40 rounded-lg p-1 border border-navy-700/30">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === '3d' ? 'bg-cyan-500/20 text-cyan-300' : 'text-navy-300 hover:text-navy-100'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3D Sonar
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === '2d' ? 'bg-cyan-500/20 text-cyan-300' : 'text-navy-300 hover:text-navy-100'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              2D Map
            </button>
          </div>
          <button onClick={downloadCSV} className="btn-ghost">
            <FileText className="w-4 h-4" />
            CSV
          </button>
          <button onClick={downloadJSON} className="btn-ghost">
            <FileJson className="w-4 h-4" />
            JSON
          </button>
          <button onClick={resetView} className="btn-secondary">
            <RotateCcw className="w-4 h-4" />
            Reset View
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <Panel className="p-3">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex items-center gap-2 pt-1">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="data-label">Filters</span>
          </div>

          {/* Type filters */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-navy-500">Anomaly Class</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(ANOMALY_TYPE_META).map(([type, meta]) => {
                const active = typeFilter.has(type as AnomalyType);
                const count = anomalies.filter((a) => a.type === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type as AnomalyType)}
                    className={`chip transition-all ${active ? '' : 'opacity-40 hover:opacity-70'}`}
                    style={{
                      color: meta.color,
                      backgroundColor: `${meta.color}15`,
                      boxShadow: active ? `0 0 0 1px ${meta.color}` : 'none',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                    <span className="font-mono text-[10px] opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority filters */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-navy-500">Priority</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(PRIORITY_META).map(([p, meta]) => {
                const active = priorityFilter.has(p as Priority);
                const count = anomalies.filter((a) => a.priority === p).length;
                return (
                  <button
                    key={p}
                    onClick={() => togglePriority(p as Priority)}
                    className={`chip transition-all ${active ? '' : 'opacity-40 hover:opacity-70'}`}
                    style={{
                      color: meta.color,
                      backgroundColor: meta.bg,
                      boxShadow: active ? `0 0 0 1px ${meta.color}` : 'none',
                    }}
                  >
                    {meta.label}
                    <span className="font-mono text-[10px] opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-navy-500">Range</span>
            <div className="flex items-center gap-3">
              {/* Confidence slider */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-navy-300">Confidence ≥</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs font-mono text-cyan-300 w-8">{minConfidence}%</span>
              </div>
              {/* Depth slider */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-navy-300">Depth ≤</span>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs font-mono text-cyan-300 w-12">{maxDepth}m</span>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="btn-ghost text-xs ml-auto mt-4">
              <RotateCcw className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>
      </Panel>

      {/* Main map area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 3D / 2D Map */}
        <Panel
          label={viewMode === '3d' ? '3D Sonar Terrain' : '2D Top-Down Map'}
          className="lg:col-span-2 p-0 overflow-hidden"
        >
          <div className="relative h-[540px] bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950">
            {viewMode === '3d' ? (
              <Seafloor3D
                anomalies={filtered}
                selectedId={selectedId}
                onSelect={handleSelect}
                resetTrigger={resetTrigger}
                focusTrigger={focusTrigger}
              />
            ) : (
              <WorldMap
                anomalies={filtered}
                selectedId={selectedId}
                onSelect={handleSelect}
                fullSize
              />
            )}

            {/* HUD overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-950/70 backdrop-blur-sm border border-navy-700/40 pointer-events-none">
              {viewMode === '3d' ? <Box className="w-3.5 h-3.5 text-cyan-400" /> : <MapIcon className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="text-xs font-mono text-navy-200">
                {viewMode === '3d' ? 'SONAR_3D_TERRAIN' : 'TOPDOWN_2D_MAP'}
              </span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-950/70 backdrop-blur-sm border border-navy-700/40 pointer-events-none">
                <Activity className={`w-3.5 h-3.5 ${isStreaming ? 'text-success-400 animate-pulse' : 'text-navy-500'}`} />
                <span className="text-xs font-mono text-navy-200">{filtered.length} DETECTIONS</span>
              </div>
              {isStreaming && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-950/70 backdrop-blur-sm border border-cyan-500/30 pointer-events-none">
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono text-cyan-300">SCAN ACTIVE</span>
                </div>
              )}
            </div>

            {/* Focus button */}
            {selectedId && viewMode === '3d' && (
              <button
                onClick={handleFocus}
                className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
              >
                <Focus className="w-3.5 h-3.5" />
                <span className="text-xs font-mono">FOCUS ON ANOMALY</span>
              </button>
            )}

            {/* Controls hint */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-navy-950/70 backdrop-blur-sm border border-navy-700/40 pointer-events-none">
              <span className="text-[10px] text-navy-400 font-mono">
                {viewMode === '3d' ? 'DRAG: rotate · SCROLL: zoom · RIGHT-DRAG: pan · CLICK: select' : 'CLICK: select · SCROLL: zoom'}
              </span>
            </div>

            {/* Depth indicator */}
            {viewMode === '3d' && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none">
                <span className="text-[9px] font-mono text-navy-500 rotate-90 origin-center whitespace-nowrap mt-8">DEPTH</span>
                <div className="w-0.5 h-24 bg-gradient-to-b from-cyan-400/40 via-navy-600/40 to-navy-700/20 rounded-full" />
                <span className="text-[9px] font-mono text-navy-400">m</span>
              </div>
            )}
          </div>
        </Panel>

        {/* Side panel: details + mini map */}
        <div className="space-y-4">
          {/* Mini world map (always visible) */}
          {viewMode === '3d' && (
            <Panel label="Geographic Context" className="p-0 overflow-hidden">
              <div className="relative h-[160px] bg-navy-950">
                <WorldMap
                  anomalies={filtered}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-navy-950/70 backdrop-blur-sm">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-mono text-navy-200">GLOBAL</span>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[8px] font-mono text-amber-300/80 tracking-wider">DEMO COORDINATES</span>
                </div>
              </div>
            </Panel>
          )}

          {/* Selected anomaly details */}
          <Panel label="Anomaly Details" className="p-0">
            {selected ? (
              <div className="p-4 space-y-3 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ANOMALY_TYPE_META[selected.type].color, boxShadow: `0 0 8px ${ANOMALY_TYPE_META[selected.type].color}` }}
                    />
                    <span className="text-sm font-bold text-navy-50">{selected.id}</span>
                  </div>
                  <Badge color={PRIORITY_META[selected.priority].color} bg={PRIORITY_META[selected.priority].bg}>
                    {PRIORITY_META[selected.priority].label}
                  </Badge>
                </div>

                {/* Classification */}
                <div>
                  <div className="data-label mb-1">Classification</div>
                  <div className="text-sm text-navy-100 font-medium">{selected.classification}</div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="data-label mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Latitude
                    </div>
                    <div className="text-xs font-mono text-cyan-300">{formatLat(selected.coordinates.lat)}</div>
                  </div>
                  <div>
                    <div className="data-label mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Longitude
                    </div>
                    <div className="text-xs font-mono text-cyan-300">{formatLng(selected.coordinates.lng)}</div>
                  </div>
                </div>

                {/* Depth + Confidence */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="data-label mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Depth
                    </div>
                    <div className="text-xs font-mono text-amber-300">{formatDepth(selected.coordinates.depth)}</div>
                  </div>
                  <div>
                    <div className="data-label mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Confidence
                    </div>
                    <div className="text-xs font-mono text-navy-100">{Math.round(selected.confidence * 100)}%</div>
                  </div>
                </div>

                <div>
                  <ConfidenceBar value={selected.confidence} />
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-navy-800/40">
                  <div className="text-center">
                    <div className="data-label">Length</div>
                    <div className="text-sm font-mono text-navy-100">{selected.dimensions.length}m</div>
                  </div>
                  <div className="text-center">
                    <div className="data-label">Width</div>
                    <div className="text-sm font-mono text-navy-100">{selected.dimensions.width}m</div>
                  </div>
                  <div className="text-center">
                    <div className="data-label">Height</div>
                    <div className="text-sm font-mono text-navy-100">{selected.dimensions.height}m</div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="data-label mb-1">Description</div>
                  <div className="text-xs text-navy-300 leading-relaxed">{selected.description}</div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-navy-700/40">
                  <div>
                    <div className="data-label mb-1">Source</div>
                    <div className="text-xs text-navy-200">{selected.source}</div>
                  </div>
                  <div>
                    <div className="data-label mb-1">Detected</div>
                    <div className="text-xs text-navy-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(selected.timestamp)}
                    </div>
                  </div>
                </div>

                {/* Filter decision */}
                <div>
                  <div className="data-label mb-1">Filter Decision</div>
                  <Badge
                    color={
                      selected.filterDecision === 'flagged' ? '#ef4444' :
                      selected.filterDecision === 'monitoring' ? '#22d3ee' : '#64748b'
                    }
                    bg={
                      selected.filterDecision === 'flagged' ? 'rgba(239,68,68,0.15)' :
                      selected.filterDecision === 'monitoring' ? 'rgba(34,211,238,0.15)' : 'rgba(100,116,139,0.15)'
                    }
                  >
                    {selected.filterDecision}
                  </Badge>
                </div>

                {/* Focus button */}
                {viewMode === '3d' && (
                  <button
                    onClick={handleFocus}
                    className="btn-primary w-full justify-center mt-2"
                  >
                    <Focus className="w-4 h-4" />
                    Focus Camera
                  </button>
                )}

                {/* Demo label */}
                <div className="text-[10px] font-mono text-amber-400/60 pt-1 text-center tracking-wider">
                  {formatTimestamp(selected.timestamp)} · DEMO / SIMULATED COORDINATES
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Crosshair className="w-8 h-8 text-navy-600 mx-auto mb-2" />
                <p className="text-sm text-navy-400">Select an anomaly to view details</p>
                <p className="text-xs text-navy-500 mt-1">Click any marker on the map</p>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Anomaly list table */}
      <Panel label={`Filtered Detections (${filtered.length})`} className="p-0">
        <div className="overflow-x-auto scrollbar-thin max-h-[280px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-navy-900/90 backdrop-blur-sm">
              <tr className="border-b border-navy-700/40">
                <th className="text-left px-4 py-2.5 data-label">ID</th>
                <th className="text-left px-4 py-2.5 data-label">Class</th>
                <th className="text-left px-4 py-2.5 data-label hidden md:table-cell">Latitude</th>
                <th className="text-left px-4 py-2.5 data-label hidden md:table-cell">Longitude</th>
                <th className="text-left px-4 py-2.5 data-label">Depth</th>
                <th className="text-left px-4 py-2.5 data-label">Confidence</th>
                <th className="text-left px-4 py-2.5 data-label hidden md:table-cell">Priority</th>
                <th className="text-left px-4 py-2.5 data-label hidden lg:table-cell">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const typeMeta = ANOMALY_TYPE_META[a.type];
                const priMeta = PRIORITY_META[a.priority];
                const isSel = selectedId === a.id;
                return (
                  <tr
                    key={a.id}
                    onClick={() => handleSelect(a.id)}
                    className={`border-b border-navy-800/40 cursor-pointer transition-colors ${
                      isSel ? 'bg-cyan-500/10' : 'hover:bg-navy-800/30'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-cyan-300">{a.id}</td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeMeta.color }} />
                        <span className="text-xs text-navy-100">{typeMeta.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="text-xs font-mono text-navy-300">{formatLat(a.coordinates.lat)}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="text-xs font-mono text-navy-300">{formatLng(a.coordinates.lng)}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono text-amber-300">{formatDepth(a.coordinates.depth)}</span>
                    </td>
                    <td className="px-4 py-2.5 w-28">
                      <ConfidenceBar value={a.confidence} />
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <Badge color={priMeta.color} bg={priMeta.bg}>{priMeta.label}</Badge>
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <span className="text-xs text-navy-300">{a.source}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="text-center text-xs text-amber-400/50 font-mono tracking-wider">
        ALL COORDINATES AND DETECTIONS ARE DEMO / SIMULATED DATA FOR PROTOTYPE EVALUATION
      </div>
    </div>
  );
}
