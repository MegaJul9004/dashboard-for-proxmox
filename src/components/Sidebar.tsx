import { Server, Boxes, HardDrive, LayoutGrid, Activity, Settings, Terminal } from 'lucide-react';

export type View = 'overview' | 'vms' | 'lxc' | 'storage' | 'tasks';

const items: { id: View; label: string; icon: typeof Server; desc: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, desc: 'Cluster at a glance' },
  { id: 'vms', label: 'Virtual Machines', icon: Server, desc: 'QEMU guests' },
  { id: 'lxc', label: 'LXC Containers', icon: Boxes, desc: 'System containers' },
  { id: 'storage', label: 'Storage', icon: HardDrive, desc: 'Pools & volumes' },
  { id: 'tasks', label: 'Tasks', icon: Activity, desc: 'Recent jobs' },
];

export function Sidebar({
  view,
  onView,
  onSettings,
  onConsole,
  connected,
}: {
  view: View;
  onView: (v: View) => void;
  onSettings: () => void;
  onConsole: () => void;
  connected: boolean;
}) {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/60 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center shadow-glow">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-ink-900 ${connected ? 'bg-success-500' : 'bg-danger-500'}`} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink-100">PVE Control</div>
          <div className="text-[11px] text-ink-400">v9.2 dashboard</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onView(it.id)}
              className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                active
                  ? 'bg-brand-500/10 text-ink-100 shadow-[inset_0_0_0_1px_rgba(58,160,255,0.25)]'
                  : 'text-ink-300 hover:bg-white/5 hover:text-ink-100'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-brand-400' : 'text-ink-400 group-hover:text-ink-200'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{it.label}</div>
                <div className="text-[11px] text-ink-400 truncate">{it.desc}</div>
              </div>
              {active && <div className="w-1 h-5 rounded-full bg-brand-400" />}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/[0.06] space-y-1">
        <button
          onClick={onConsole}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-ink-300 hover:bg-white/5 hover:text-ink-100 transition-colors"
        >
          <Terminal className="w-[18px] h-[18px] text-ink-400" />
          <span className="text-sm font-medium">Console</span>
        </button>
        <button
          onClick={onSettings}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-ink-300 hover:bg-white/5 hover:text-ink-100 transition-colors"
        >
          <Settings className="w-[18px] h-[18px] text-ink-400" />
          <span className="text-sm font-medium">Connection Info</span>
        </button>
      </div>

      <div className="px-5 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-success-500' : 'bg-danger-500'} relative`}>
            {connected && <span className="absolute inset-0 rounded-full bg-success-500 animate-pulse-ring" />}
          </span>
          <span className="text-[11px] text-ink-400">{connected ? 'Live connection' : 'Not connected'}</span>
        </div>
      </div>
    </aside>
  );
}
