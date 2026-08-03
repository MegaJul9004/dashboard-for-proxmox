import { RefreshCw, Search, Server, Boxes, HardDrive, Cpu, MemoryStick, Clock, Menu, Settings, Gauge } from 'lucide-react';
import type { ProxmoxState } from '../types';
import type { View } from './Sidebar';

const INTERVAL_OPTIONS = [
  { label: '2s', value: 2000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: 'Off', value: 0 },
];

export function Topbar({
  state,
  view,
  onView,
  onRefresh,
  onSettings,
  polling,
  setPolling,
  pollInterval,
  setPollInterval,
  search,
  setSearch,
  onMenu,
}: {
  state: ProxmoxState;
  view: View;
  onView: (v: View) => void;
  onRefresh: () => void;
  onSettings: () => void;
  polling: boolean;
  setPolling: (b: boolean) => void;
  pollInterval: number;
  setPollInterval: (ms: number) => void;
  search: string;
  setSearch: (s: string) => void;
  onMenu: () => void;
}) {
  const vms = state.resources.filter((r) => r.type === 'qemu');
  const lxcs = state.resources.filter((r) => r.type === 'lxc');
  const running = state.resources.filter((r) => r.status === 'running').length;

  const stats = [
    { icon: Server, label: 'VMs', value: vms.length, color: 'text-brand-400' },
    { icon: Boxes, label: 'LXC', value: lxcs.length, color: 'text-accent-400' },
    { icon: Cpu, label: 'Running', value: running, color: 'text-success-400' },
    { icon: HardDrive, label: 'Nodes', value: state.nodes.length, color: 'text-ink-200' },
  ];

  const handleIntervalChange = (ms: number) => {
    if (ms === 0) {
      setPolling(false);
    } else {
      setPolling(true);
      setPollInterval(ms);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 md:px-6 h-16">
        <button onClick={onMenu} className="md:hidden btn btn-ghost -ml-1">
          <Menu className="w-5 h-5" />
        </button>

        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center">
            <Server className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold">PVE Control</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-ink-400 text-sm">
          <span className="text-ink-200 font-medium capitalize">{viewLabel(view)}</span>
          {state.version && (
            <>
              <span className="text-ink-600">·</span>
              <span className="text-ink-400">{state.version}</span>
            </>
          )}
        </div>

        <div className="flex-1" />

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search VMs, containers…"
            className="input pl-9 w-56 lg:w-72"
          />
        </div>

        {/* Refresh interval selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-ink-800/60 border border-white/[0.06]">
          <Gauge className="w-3.5 h-3.5 text-ink-400 ml-1" />
          <select
            value={polling ? pollInterval : 0}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            className="bg-transparent text-xs text-ink-200 outline-none cursor-pointer pr-1 py-1"
            title="Refresh interval"
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-ink-850 text-ink-100">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setPolling(!polling)}
          className={`btn ${polling ? 'text-success-400' : 'text-ink-400'} btn-ghost`}
          title={polling ? 'Auto-refresh on' : 'Auto-refresh paused'}
        >
          <span className={`w-2 h-2 rounded-full ${polling ? 'bg-success-500' : 'bg-ink-500'}`} />
          <span className="hidden lg:inline">{polling ? 'Live' : 'Paused'}</span>
        </button>

        <button onClick={onRefresh} className="btn btn-ghost" title="Refresh now">
          <RefreshCw className={`w-4 h-4 ${state.status === 'connecting' ? 'animate-spin' : ''}`} />
        </button>

        <button onClick={onSettings} className="btn btn-primary sm:hidden">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 px-4 md:px-6 pb-3 overflow-x-auto scrollbar-thin">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-2 shrink-0">
              <Icon className={`w-3.5 h-3.5 ${s.color}`} />
              <span className="text-xs text-ink-400">{s.label}</span>
              <span className="text-sm font-semibold text-ink-100">{s.value}</span>
            </div>
          );
        })}
        {state.lastUpdated && (
          <div className="flex items-center gap-1.5 shrink-0 ml-auto text-xs text-ink-400">
            <Clock className="w-3 h-3" />
            {new Date(state.lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>
    </header>
  );
}

function viewLabel(v: View): string {
  return { overview: 'Overview', vms: 'Virtual Machines', lxc: 'LXC Containers', storage: 'Storage', tasks: 'Tasks' }[v];
}

export { MemoryStick };
