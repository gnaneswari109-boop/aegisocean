import { useState, useCallback, useRef } from 'react';
import {
  Upload, FileImage, Play, FileJson, FileText,
  CheckCircle2, Loader2, Image as ImageIcon, Layers, ScanSearch,
  Brain, FileBarChart, AlertTriangle, X,
} from 'lucide-react';
import { Panel, Badge, ConfidenceBar, EmptyState } from '../components/ui';
import { ANOMALY_TYPE_META, PRIORITY_META } from '../types';
import type { Anomaly, AnalysisResult, PipelineStep, PipelineStage } from '../types';
import { generateAnalysisAnomalies, formatCoordinates, formatDepth, formatTimestamp } from '../data/demo';
import { downloadFile, anomaliesToCSV, anomaliesToJSON } from '../data/downloads';
import { useSession } from '../context/SessionContext';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/tiff', 'image/tif'];
const PIPELINE_DEFINITIONS: { stage: PipelineStage; label: string; icon: typeof Upload; detail: string }[] = [
  { stage: 'preprocessing', label: 'Preprocessing', icon: Layers, detail: 'Noise reduction, histogram equalization, geometric correction' },
  { stage: 'feature_extraction', label: 'Feature Extraction', icon: ScanSearch, detail: 'Texture analysis, edge detection, backscatter profiling' },
  { stage: 'detection', label: 'Detection', icon: AlertTriangle, detail: 'Region proposal, non-maximum suppression, bounding box regression' },
  { stage: 'classification', label: 'Classification', icon: Brain, detail: 'Multi-class anomaly identification with confidence scoring' },
  { stage: 'reporting', label: 'Report Generation', icon: FileBarChart, detail: 'Compiling anomaly catalog, coordinates, and filter decisions' },
];

type ViewState = 'original' | 'processed' | 'detection';

export function AnalyzePage() {
  const { addAnomaly } = useSession();
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<ViewState>('original');
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  const validateFile = (file: File): boolean => {
    const ext = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    const extMatch = ACCEPTED_TYPES.some((t) => ext === t) ||
      ['.png', '.jpg', '.jpeg', '.tif', '.tiff'].some((e) => name.endsWith(e));
    if (!extMatch) {
      setError('Unsupported format. Please upload PNG, JPEG, or TIFF files.');
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50 MB.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return;
    clearTimeouts();
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || 'image/unknown');
    setResult(null);
    setSelectedAnomaly(null);
    setView('original');
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const loadSample = () => {
    clearTimeouts();
    const sampleName = 'sample-sonar-sweep-A12.tif';
    setFileName(sampleName);
    setFileSize(8388608);
    setFileType('image/tiff');
    setError('');
    setResult(null);
    setSelectedAnomaly(null);
    setView('original');
    setImageUrl('');
  };

  const runAnalysis = () => {
    if (!fileName) return;
    clearTimeouts();
    setIsProcessing(true);
    setResult(null);
    setSelectedAnomaly(null);
    setView('original');

    const steps: PipelineStep[] = PIPELINE_DEFINITIONS.map((d) => ({
      stage: d.stage,
      label: d.label,
      status: 'pending',
      detail: d.detail,
    }));
    setPipelineSteps(steps);

    const seed = fileName.length + fileSize + Date.now();
    const anomalies = generateAnalysisAnomalies(seed);
    const processingTime = 1200 + Math.floor(Math.random() * 800);

    PIPELINE_DEFINITIONS.forEach((def, idx) => {
      const t1 = setTimeout(() => {
        setPipelineSteps((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, status: 'active' } : s))
        );
      }, idx * 600);
      timeoutRefs.current.push(t1);

      const t2 = setTimeout(() => {
        setPipelineSteps((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, status: 'complete' } : s))
        );
      }, idx * 600 + 500);
      timeoutRefs.current.push(t2);
    });

    const tDone = setTimeout(() => {
      const res: AnalysisResult = {
        fileName,
        fileSize,
        fileType,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        anomalies,
        pipelineSteps: steps.map((s) => ({ ...s, status: 'complete' as const })),
      };
      setResult(res);
      setIsProcessing(false);
      setView('detection');
      anomalies.forEach((a) => addAnomaly(a));
    }, PIPELINE_DEFINITIONS.length * 600 + 700);
    timeoutRefs.current.push(tDone);
  };

  const downloadCSV = () => {
    if (!result) return;
    const csv = anomaliesToCSV(result.anomalies);
    downloadFile(csv, `aegisocean-report-${Date.now()}.csv`, 'text/csv');
  };

  const downloadJSON = () => {
    if (!result) return;
    const json = anomaliesToJSON(result.anomalies);
    downloadFile(json, `aegisocean-report-${Date.now()}.json`, 'application/json');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-50">Analyze Sonar Imagery</h1>
        <p className="text-sm text-navy-400 mt-1">
          Upload sonar or bathymetric imagery for automated anomaly detection. All results are demonstration data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload + pipeline */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload zone */}
          <Panel label="Image Input" className="p-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-500/5'
                  : 'border-navy-600/50 hover:border-navy-500 hover:bg-navy-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.tif,.tiff,image/png,image/jpeg,image/tiff"
                onChange={onFileSelect}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-cyan-400/60 mx-auto mb-3" />
              <p className="text-sm text-navy-200 font-medium">Drop image here or click to browse</p>
              <p className="text-xs text-navy-400 mt-1">PNG, JPEG, TIFF — max 50 MB</p>
            </div>

            {error && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-coral-500/10 border border-coral-500/30 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-coral-400" />
                <span className="text-xs text-coral-300">{error}</span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button onClick={loadSample} className="btn-ghost flex-1 justify-center">
                <ImageIcon className="w-4 h-4" />
                Use Sample Sonar
              </button>
            </div>

            {fileName && (
              <div className="mt-3 p-3 rounded-lg bg-navy-800/50 border border-navy-700/40">
                <div className="flex items-center gap-2 mb-2">
                  <FileImage className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-navy-100 font-medium truncate flex-1">{fileName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileName(''); setResult(null); setSelectedAnomaly(null); setImageUrl('');
                    }}
                    className="text-navy-400 hover:text-coral-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-navy-400 font-mono">
                  <span>{formatSize(fileSize)}</span>
                  <span className="w-1 h-1 rounded-full bg-navy-600" />
                  <span>{fileType}</span>
                </div>
              </div>
            )}

            <button
              onClick={runAnalysis}
              disabled={!fileName || isProcessing}
              className="btn-primary w-full mt-3 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isProcessing ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </Panel>

          {/* Pipeline */}
          {(isProcessing || pipelineSteps.length > 0) && (
            <Panel label="Processing Pipeline" className="p-4">
              <div className="space-y-3 mt-2">
                {pipelineSteps.map((step, idx) => {
                  const def = PIPELINE_DEFINITIONS[idx];
                  const Icon = def.icon;
                  return (
                    <div
                      key={step.stage}
                      className={`flex items-start gap-3 p-2.5 rounded-lg transition-all ${
                        step.status === 'active'
                          ? 'bg-cyan-500/10 border border-cyan-500/30'
                          : step.status === 'complete'
                          ? 'bg-navy-800/30'
                          : 'opacity-40'
                      }`}
                    >
                      <div className={`mt-0.5 ${step.status === 'complete' ? 'text-success-400' : step.status === 'active' ? 'text-cyan-400' : 'text-navy-500'}`}>
                        {step.status === 'complete' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : step.status === 'active' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${step.status === 'pending' ? 'text-navy-400' : 'text-navy-100'}`}>
                            {step.label}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-navy-500">
                            {step.status}
                          </span>
                        </div>
                        {step.status === 'active' && (
                          <p className="text-xs text-navy-300 mt-0.5">{step.detail}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>

        {/* Image views + results */}
        <div className="lg:col-span-2 space-y-6">
          {/* View tabs */}
          {fileName && (
            <Panel className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="data-label">Imagery View</span>
                <div className="flex items-center gap-1 bg-navy-800/40 rounded-lg p-1">
                  {(['original', 'processed', 'detection'] as ViewState[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      disabled={!result && v !== 'original'}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        view === v
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'text-navy-300 hover:text-navy-100 disabled:opacity-30 disabled:cursor-not-allowed'
                      }`}
                    >
                      {v === 'original' ? 'Original' : v === 'processed' ? 'Processed' : 'Detections'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image canvas */}
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-navy-950 border border-navy-700/40">
                {/* Background */}
                {imageUrl ? (
                  <img src={imageUrl} alt="Sonar" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900" />
                )}

                {/* Processed overlay */}
                {view === 'processed' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-navy-950/60 to-navy-900/40">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.08) 2px, rgba(34,211,238,0.08) 4px)',
                    }} />
                    {/* Scan line animation */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute left-0 right-0 h-1 bg-cyan-400/30 animate-scan-line" />
                    </div>
                    {/* Histogram-like bars */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end gap-0.5 px-2 opacity-40">
                      {Array.from({ length: 60 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-cyan-400 rounded-t-sm"
                          style={{ height: `${20 + Math.sin(i * 0.3) * 30 + Math.random() * 20}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Detection overlay */}
                {view === 'detection' && result && (
                  <div className="absolute inset-0">
                    {/* Grid overlay */}
                    <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                    {/* Bounding boxes */}
                    {result.anomalies.map((a, idx) => {
                      if (!a.bbox) return null;
                      const meta = ANOMALY_TYPE_META[a.type];
                      const isSelected = selectedAnomaly?.id === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setSelectedAnomaly(a)}
                          className="absolute border-2 rounded-sm transition-all cursor-pointer hover:z-10"
                          style={{
                            left: `${(a.bbox.x / 400) * 100}%`,
                            top: `${(a.bbox.y / 300) * 100}%`,
                            width: `${(a.bbox.w / 400) * 100}%`,
                            height: `${(a.bbox.h / 300) * 100}%`,
                            borderColor: meta.color,
                            backgroundColor: `${meta.color}15`,
                            boxShadow: isSelected ? `0 0 20px ${meta.color}80` : 'none',
                          }}
                        >
                          <span
                            className="absolute -top-5 left-0 px-1.5 py-0.5 rounded-sm text-[9px] font-mono font-bold whitespace-nowrap"
                            style={{ backgroundColor: meta.color, color: '#0a1a33' }}
                          >
                            {meta.shortLabel} {Math.round(a.confidence * 100)}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Idle state */}
                {!fileName && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <EmptyState message="Upload an image to begin analysis" />
                  </div>
                )}

                {/* Corner labels */}
                {fileName && (
                  <>
                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-navy-950/70 backdrop-blur-sm text-[10px] font-mono text-cyan-300">
                      {view.toUpperCase()}
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-navy-950/70 backdrop-blur-sm text-[10px] font-mono text-navy-300">
                      {result ? `${result.anomalies.length} DETECTIONS` : 'AWAITING ANALYSIS'}
                    </div>
                  </>
                )}
              </div>

              {/* Result summary */}
              {result && (
                <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-navy-800/40 border border-navy-700/30">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-navy-300">
                      <span className="text-navy-500">Processing:</span>{' '}
                      <span className="font-mono text-cyan-300">{result.processingTimeMs}ms</span>
                    </span>
                    <span className="text-navy-300 hidden sm:inline">
                      <span className="text-navy-500">Detections:</span>{' '}
                      <span className="font-mono text-amber-300">{result.anomalies.length}</span>
                    </span>
                    <span className="text-navy-300 hidden sm:inline">
                      <span className="text-navy-500">Time:</span>{' '}
                      <span className="font-mono text-navy-200">{formatTimestamp(result.timestamp)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={downloadCSV} className="btn-ghost text-xs">
                      <FileText className="w-3.5 h-3.5" />
                      CSV
                    </button>
                    <button onClick={downloadJSON} className="btn-ghost text-xs">
                      <FileJson className="w-3.5 h-3.5" />
                      JSON
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          )}

          {/* Anomaly list */}
          {result && (
            <Panel label={`Detected Anomalies (${result.anomalies.length})`} className="p-0">
              <div className="divide-y divide-navy-800/40">
                {result.anomalies.map((a) => {
                  const typeMeta = ANOMALY_TYPE_META[a.type];
                  const priMeta = PRIORITY_META[a.priority];
                  const isSelected = selectedAnomaly?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedAnomaly(a); setView('detection'); }}
                      className={`w-full text-left p-4 hover:bg-navy-800/30 transition-colors ${isSelected ? 'bg-navy-800/40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeMeta.color }} />
                          <span className="text-sm font-medium text-navy-100">{a.classification}</span>
                        </div>
                        <Badge color={priMeta.color} bg={priMeta.bg}>{priMeta.label}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-navy-500">ID: </span>
                          <span className="font-mono text-cyan-300">{a.id}</span>
                        </div>
                        <div>
                          <span className="text-navy-500">Depth: </span>
                          <span className="font-mono text-navy-200">{formatDepth(a.coordinates.depth)}</span>
                        </div>
                        <div className="hidden md:block">
                          <span className="text-navy-500">Source: </span>
                          <span className="text-navy-200">{a.source}</span>
                        </div>
                        <div>
                          <span className="text-navy-500">Filter: </span>
                          <span className={`font-mono ${a.filterDecision === 'flagged' ? 'text-coral-400' : a.filterDecision === 'monitoring' ? 'text-cyan-400' : 'text-navy-400'}`}>
                            {a.filterDecision}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <ConfidenceBar value={a.confidence} />
                      </div>
                      {isSelected && (
                        <div className="mt-3 p-3 rounded-lg bg-navy-900/60 border border-navy-700/40 space-y-1.5 animate-fade-in">
                          <div className="text-xs text-navy-300">{a.description}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-navy-500">Coordinates: </span>
                              <span className="font-mono text-navy-200">{formatCoordinates(a.coordinates.lat, a.coordinates.lng)}</span>
                            </div>
                            <div>
                              <span className="text-navy-500">Dimensions: </span>
                              <span className="font-mono text-navy-200">{a.dimensions.length}m × {a.dimensions.width}m × {a.dimensions.height}m</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* Empty hint */}
          {!fileName && (
            <Panel className="p-8">
              <div className="text-center">
                <ScanSearch className="w-10 h-10 text-navy-600 mx-auto mb-3" />
                <p className="text-sm text-navy-400">
                  Upload a sonar image or use the sample sonar to run the full detection pipeline.
                </p>
                <p className="text-xs text-navy-500 mt-2">
                  The pipeline runs preprocessing, feature extraction, detection, classification, and report generation.
                </p>
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-navy-500">
        Analysis results are generated by a deterministic demonstration evaluator — not a validated production model.
      </div>
    </div>
  );
}
