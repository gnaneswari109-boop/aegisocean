export type AnomalyType =
  | 'fishing_net'
  | 'plastic_debris'
  | 'metal_object'
  | 'tire'
  | 'pipeline'
  | 'shipwreck'
  | 'unknown_anomaly';

export type Priority = 'critical' | 'high' | 'moderate' | 'low';

export type FilterDecision = 'flagged' | 'monitoring' | 'dismissed';

export interface Coordinates {
  lat: number;
  lng: number;
  depth: number;
}

export interface Anomaly {
  id: string;
  type: AnomalyType;
  classification: string;
  confidence: number;
  priority: Priority;
  dimensions: { length: number; width: number; height: number };
  coordinates: Coordinates;
  source: string;
  timestamp: string;
  filterDecision: FilterDecision;
  description: string;
  bbox?: { x: number; y: number; w: number; h: number };
}

export type PipelineStage =
  | 'idle'
  | 'preprocessing'
  | 'feature_extraction'
  | 'detection'
  | 'classification'
  | 'reporting';

export interface PipelineStep {
  stage: PipelineStage;
  label: string;
  status: 'pending' | 'active' | 'complete';
  detail: string;
}

export interface AnalysisResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  timestamp: string;
  processingTimeMs: number;
  anomalies: Anomaly[];
  pipelineSteps: PipelineStep[];
}

export interface SessionStats {
  totalScans: number;
  totalAnomalies: number;
  flaggedCount: number;
  monitoringCount: number;
  dismissedCount: number;
  typeDistribution: Record<AnomalyType, number>;
  avgConfidence: number;
}

export const ANOMALY_TYPE_META: Record<
  AnomalyType,
  { label: string; color: string; shortLabel: string; icon: string }
> = {
  fishing_net: { label: 'Fishing Net / Ghost Net', color: '#22d3ee', shortLabel: 'FNT', icon: 'net' },
  plastic_debris: { label: 'Plastic Debris', color: '#fbbf24', shortLabel: 'PLD', icon: 'plastic' },
  metal_object: { label: 'Metal Object', color: '#94a3b8', shortLabel: 'MTL', icon: 'metal' },
  tire: { label: 'Tire', color: '#a78bfa', shortLabel: 'TIR', icon: 'tire' },
  pipeline: { label: 'Pipeline', color: '#f97316', shortLabel: 'PIP', icon: 'pipeline' },
  shipwreck: { label: 'Shipwreck', color: '#ef4444', shortLabel: 'SHP', icon: 'wreck' },
  unknown_anomaly: { label: 'Unknown Anomaly', color: '#64748b', shortLabel: 'UNK', icon: 'unknown' },
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; bg: string }
> = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  high: { label: 'High', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  moderate: { label: 'Moderate', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)' },
  low: { label: 'Low', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
};
