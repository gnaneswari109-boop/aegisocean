import type { Anomaly } from '../types';
import { ANOMALY_TYPE_META, PRIORITY_META } from '../types';

export function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function anomaliesToCSV(anomalies: Anomaly[]): string {
  const headers = [
    'ID', 'Type', 'Classification', 'Confidence', 'Priority',
    'Latitude', 'Longitude', 'Depth (m)',
    'Length (m)', 'Width (m)', 'Height (m)',
    'Source', 'Timestamp', 'Filter Decision', 'Description',
  ];
  const rows = anomalies.map((a) => [
    a.id,
    ANOMALY_TYPE_META[a.type].label,
    a.classification,
    a.confidence.toFixed(2),
    PRIORITY_META[a.priority].label,
    a.coordinates.lat.toFixed(4),
    a.coordinates.lng.toFixed(4),
    a.coordinates.depth.toFixed(1),
    a.dimensions.length.toFixed(1),
    a.dimensions.width.toFixed(1),
    a.dimensions.height.toFixed(1),
    a.source,
    a.timestamp,
    a.filterDecision,
    a.description,
  ].map(String).map(escapeCSV).join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function anomaliesToJSON(anomalies: Anomaly[]): string {
  return JSON.stringify(anomalies, null, 2);
}
