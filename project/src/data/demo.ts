import type {
  Anomaly,
  AnomalyType,
  Priority,
  FilterDecision,
  SessionStats,
} from '../types';

const ANOMALY_TYPES: AnomalyType[] = [
  'fishing_net',
  'plastic_debris',
  'metal_object',
  'tire',
  'pipeline',
  'shipwreck',
  'unknown_anomaly',
];

const CLASSIFICATIONS: Record<AnomalyType, string[]> = {
  fishing_net: ['Possible Fishing Net', 'Ghost Net Entanglement', 'Discarded Gill Net'],
  plastic_debris: ['Plastic Debris Field', 'Polymer Fragment Cluster', 'Synthetic Waste Accumulation'],
  metal_object: ['Metallic Object', 'Ferrous Debris Fragment', 'Corroded Metal Structure'],
  tire: ['Vehicle Tire', 'Tire Pile Accumulation', 'Rubber Debris Mass'],
  pipeline: ['Pipeline Segment', 'Subsea Cable Route', 'Pipeline Joint Anomaly'],
  shipwreck: ['Shipwreck Hull', 'Vessel Debris Field', 'Wreckage Structure'],
  unknown_anomaly: ['Unknown Anomaly', 'Unresolved Acoustic Return', 'Unidentified Object'],
};

const DESCRIPTIONS: Record<AnomalyType, string[]> = {
  fishing_net: [
    'Entangled fishing net approximately 4m across, consistent with discarded gill net. High entanglement risk for marine life.',
    'Ghost net draped across seabed, estimated 6m length. Biofouling suggests prolonged submersion period.',
    'Active fishing net detected with mesh pattern visible in sonar return. Estimated 3m width.',
  ],
  plastic_debris: [
    'Scattered plastic fragments spanning 8-12m. Mixed polymer types including containers, sheeting, and rope.',
    'Dense plastic debris field with high backscatter variability. Anthropogenic waste accumulation confirmed.',
    'Plastic accumulation with entangled netting and containers. Moderate dispersal pattern detected.',
  ],
  metal_object: [
    'Cylindrical metallic object ~2.5m length, strong ferrous return. Possible equipment remnant or debris.',
    'Flat metallic plate with corroded edges, estimated 1.5m x 0.8m. High density acoustic signature.',
    'Composite metallic structure with internal cavity. Anthropogenic origin probable.',
  ],
  tire: [
    'Single vehicle tire, approximately 0.8m diameter. Rubber degradation visible in acoustic profile.',
    'Cluster of 3-5 tires partially buried in sediment. Estimated coverage area 4m.',
    'Tire pile with associated rubber debris. Moderate biofouling on outer surfaces.',
  ],
  pipeline: [
    'Exposed pipeline segment approximately 15m, running NE-SW. Coating degradation detected.',
    'Subsea pipeline with joint anomaly at 8m mark. Possible leak indicator requires investigation.',
    'Cable route crossing survey area, estimated 20m exposed length. Partial sediment burial.',
  ],
  shipwreck: [
    'Shipwreck hull structure, approximately 25m length. Wooden and metal composite construction.',
    'Vessel debris field spanning 30m. Scattered hull plates and superstructure remains.',
    'Wreckage structure with intact bow section. Estimated vessel length 18m.',
  ],
  unknown_anomaly: [
    'Unresolved acoustic return with no matching classification template. Requires manual review.',
    'Anomalous density region with inconsistent backscatter. Possibly composite or obscured object.',
    'Unidentified reflector at mid-water depth. May be transient or artifact-related.',
  ],
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generateAnomaly(index: number, rng: () => number, regionCenter?: { lat: number; lng: number; depth: number }): Anomaly {
  const type = pick(ANOMALY_TYPES, rng);
  const classification = pick(CLASSIFICATIONS[type], rng);
  const description = pick(DESCRIPTIONS[type], rng);
  const confidence = Math.round((0.55 + rng() * 0.44) * 100) / 100;
  const priority: Priority = confidence > 0.88 ? 'critical' : confidence > 0.75 ? 'high' : confidence > 0.62 ? 'moderate' : 'low';

  const baseLat = regionCenter?.lat ?? 13.6288;
  const baseLng = regionCenter?.lng ?? 79.4192;
  const baseDepth = regionCenter?.depth ?? 850;

  const lat = baseLat + (rng() - 0.5) * 0.6;
  const lng = baseLng + (rng() - 0.5) * 0.6;
  const depth = Math.max(50, baseDepth + (rng() - 0.5) * 400);

  const filterDecision: FilterDecision =
    confidence > 0.82 ? 'flagged' : confidence > 0.65 ? 'monitoring' : 'dismissed';

  const length = Math.round((0.5 + rng() * 20) * 10) / 10;
  const width = Math.round((0.3 + rng() * 8) * 10) / 10;
  const height = Math.round((0.1 + rng() * 3) * 10) / 10;

  const now = new Date();
  const minutesAgo = Math.floor(rng() * 720);
  const timestamp = new Date(now.getTime() - minutesAgo * 60000).toISOString();

  const sources = ['Sonar Sweep A-12', 'Side-scan B-07', 'Multibeam C-03', 'AUV Survey D-19', 'ROV Inspection E-22'];

  return {
    id: `MG-${String(index).padStart(4, '0')}`,
    type,
    classification,
    confidence,
    priority,
    dimensions: { length, width, height },
    coordinates: { lat, lng, depth },
    source: pick(sources, rng),
    timestamp,
    filterDecision,
    description,
  };
}

export function generateInitialAnomalies(count: number = 24): Anomaly[] {
  const rng = seededRandom(42);
  return Array.from({ length: count }, (_, i) => generateAnomaly(i + 1, rng));
}

export function generateStreamedAnomaly(index: number): Anomaly {
  const rng = seededRandom(Date.now() + index * 7);
  return generateAnomaly(index, rng);
}

export function generateAnalysisAnomalies(seed: number): Anomaly[] {
  const rng = seededRandom(seed);
  const count = 3 + Math.floor(rng() * 4);
  return Array.from({ length: count }, (_, i) => {
    const a = generateAnomaly(i + 1, rng, { lat: 13.6288, lng: 79.4192, depth: 850 });
    return {
      ...a,
      bbox: {
        x: Math.round(rng() * 300 + 50),
        y: Math.round(rng() * 200 + 30),
        w: Math.round(40 + rng() * 80),
        h: Math.round(30 + rng() * 60),
      },
    };
  });
}

export function computeStats(anomalies: Anomaly[]): SessionStats {
  const typeDistribution = {} as Record<AnomalyType, number>;
  ANOMALY_TYPES.forEach((t) => (typeDistribution[t] = 0));

  let flagged = 0, monitoring = 0, dismissed = 0, confSum = 0;
  for (const a of anomalies) {
    typeDistribution[a.type]++;
    if (a.filterDecision === 'flagged') flagged++;
    else if (a.filterDecision === 'monitoring') monitoring++;
    else dismissed++;
    confSum += a.confidence;
  }

  return {
    totalScans: Math.ceil(anomalies.length / 3),
    totalAnomalies: anomalies.length,
    flaggedCount: flagged,
    monitoringCount: monitoring,
    dismissedCount: dismissed,
    typeDistribution,
    avgConfidence: anomalies.length > 0 ? Math.round((confSum / anomalies.length) * 100) / 100 : 0,
  };
}

export function formatCoordinates(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}\u00b0${ns}, ${Math.abs(lng).toFixed(4)}\u00b0${ew}`;
}

export function formatLat(lat: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  return `${Math.abs(lat).toFixed(4)}\u00b0 ${ns}`;
}

export function formatLng(lng: number): string {
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lng).toFixed(4)}\u00b0 ${ew}`;
}

export function formatDepth(depth: number): string {
  return `${depth.toFixed(1)} m`;
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
