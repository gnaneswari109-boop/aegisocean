import { Outlet, Link, useRouterState } from '@tanstack/react-router';
import { LayoutGrid, ScanSearch, Map, Radio, Activity } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { AegisLogo } from './AegisLogo';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutGrid },
  { path: '/analyze', label: 'Analyze', icon: ScanSearch },
  { path: '/anomaly-map', label: 'Anomaly Map', icon: Map },
];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isStreaming, toggleStreaming, streamProgress } = useSession();

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-navy-900/80 backdrop-blur-lg border-b border-navy-700/50">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <AegisLogo size={36} />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-navy-50 tracking-wide">AegisOcean AI</span>
                <span className="text-[10px] text-cyan-400/70 tracking-[0.2em] uppercase">AI-Powered Underwater Intelligence</span>
              </div>
            </div>

            {/* Nav tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-navy-800/40 rounded-lg p-1 border border-navy-700/30">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-tab ${active ? 'nav-tab-active' : 'nav-tab-inactive'} flex items-center gap-2 rounded-md`}
                  >
                    {active && (
                      <span className="absolute inset-0 bg-cyan-500/10 rounded-md border border-cyan-400/20" />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Status */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-blink" />
                <span className="text-[11px] text-amber-300 font-medium tracking-wide">DEMO DATA</span>
              </div>
              <button
                onClick={toggleStreaming}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800/60 border border-navy-600/40 hover:border-cyan-500/40 transition-colors"
              >
                <Radio className={`w-3.5 h-3.5 ${isStreaming ? 'text-cyan-400' : 'text-navy-400'}`} />
                <span className="text-xs font-medium text-navy-200">
                  {isStreaming ? 'Streaming' : 'Paused'}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto scrollbar-thin">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-tab ${active ? 'nav-tab-active' : 'nav-tab-inactive'} flex items-center gap-1.5 rounded-md whitespace-nowrap text-xs`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Stream progress bar */}
        {isStreaming && (
          <div className="h-0.5 bg-navy-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500/0 via-cyan-400/60 to-cyan-500/0 transition-all duration-100"
              style={{ width: `${streamProgress}%` }}
            />
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-6 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800/50 bg-navy-900/40">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-navy-400">
            <Activity className="w-3 h-3" />
            <span>AegisOcean AI Prototype — All detections, coordinates, and scores are demonstration data</span>
          </div>
          <div className="text-[11px] text-navy-500 font-mono">v0.9.0-proto</div>
        </div>
      </footer>
    </div>
  );
}
