import { Server, Boxes, Cpu, MemoryStick, HardDrive, Activity, TrendingUp, Clock, Zap } from 'lucide-react';
import type { ProxmoxNode, ProxmoxResource, ProxmoxStorage, ProxmoxTask } from '../types';
import { formatBytes, formatUptime, pct, statusBg, statusDot } from '../utils';
import { UsageBar, RadialGauge, Sparkline } from './Visuals';
import type { View } from './Sidebar';

export function Overview({
  nodes,
  resources,
  storage,
  tasks,
  onView,
  onSelect,
}: {
  nodes: ProxmoxNode[];
  resources: ProxmoxResource[];
  storage: ProxmoxStorage[];
  tasks: ProxmoxTask[];
  onView: (v: View) => void;
  onSelect: (r: ProxmoxResource) => void;
}) {
  const vms = resources.filter((r) => r.type === 'qemu');
  const lxcs = resources.filter((r) => r.type === 'lxc');
  const running = resources.filter((r) => r.status === 'running');
  const stopped = resources.filter((r) => r.status === 'stopped');
  const paused = resources.filter((r) => r.status === 'paused');

  const totalCpu = nodes.reduce((a, n) => a + n.cpu, 0) / Math.max(1, nodes.length);
  const totalMem = nodes.reduce((a, n) => a + n.memory, 0);
  const totalMaxMem = nodes.reduce((a, n) => a + n.maxmem, 0);
  const totalDisk = nodes.reduce((a, n) => a + n.disk, 0);
  const totalMaxDisk = nodes.reduce((a, n) => a + n.maxdisk, 0);

  // synthetic sparkline data derived from current load
  const cpuSeries = nodes.map((n) => n.cpu * 100).concat([totalCpu * 100]);
  const memSeries = nodes.map((n) => (n.memory / Math.max(1, n.maxmem)) * 100);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroCard
          icon={Server}
          label="Virtual Machines"
          value={vms.length}
          sub={`${vms.filter((r) => r.status === 'running').length} running`}
          color="from-brand-500/20 to-brand-500/5"
          iconColor="text-brand-400"
        />
        <HeroCard
          icon={Boxes}
          label="LXC Containers"
          value={lxcs.length}
          sub={`${lxcs.filter((r) => r.status === 'running').length} running`}
          color="from-accent-500/20 to-accent-500/5"
          iconColor="text-accent-400"
        />
        <HeroCard
          icon={Activity}
          label="Running"
          value={running.length}
          sub={`${stopped.length} stopped · ${paused.length} paused`}
          color="from-success-500/20 to-success-500/5"
          iconColor="text-success-400"
        />
        <HeroCard
          icon={HardDrive}
          label="Nodes"
          value={nodes.length}
          sub={`${nodes.filter((n) => n.status === 'online').length} online`}
          color="from-warn-500/20 to-warn-500/5"
          iconColor="text-warn-400"
        />
      </div>

      {/* Cluster utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-100">Cluster Utilization</h3>
              <p className="text-xs text-ink-400">Aggregated across {nodes.length} node{nodes.length !== 1 ? 's' : ''}</p>
            </div>
            <span className="chip bg-success-500/15 text-success-400 border border-success-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> Healthy
            </span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <ClusterStat
              icon={Cpu}
              label="CPU"
              value={totalCpu}
              series={cpuSeries}
              color="#3aa0ff"
            />
            <ClusterStat
              icon={MemoryStick}
              label="Memory"
              value={totalMem / Math.max(1, totalMaxMem)}
              series={memSeries}
              color="#22d3ee"
              detail={`${formatBytes(totalMem)} / ${formatBytes(totalMaxMem)}`}
            />
            <ClusterStat
              icon={HardDrive}
              label="Disk"
              value={totalDisk / Math.max(1, totalMaxDisk)}
              series={[totalDisk / Math.max(1, totalMaxDisk) * 100]}
              color="#10b981"
              detail={`${formatBytes(totalDisk)} / ${formatBytes(totalMaxDisk)}`}
            />
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-ink-100 mb-4">Recent Tasks</h3>
          <div className="space-y-2.5">
            {tasks.slice(0, 5).map((t) => (
              <div key={t.upid} className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'OK' ? 'bg-success-500' : 'bg-danger-500'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ink-100 truncate font-mono">{t.type}</div>
                  <div className="text-[11px] text-ink-400 truncate">{t.node} · {t.user}</div>
                </div>
                <span className="text-[11px] text-ink-400 shrink-0">
                  {new Date(t.starttime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {!tasks.length && <p className="text-xs text-ink-400">No recent tasks.</p>}
          </div>
          <button onClick={() => onView('tasks')} className="btn btn-ghost w-full mt-3 text-xs">
            View all tasks <TrendingUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Nodes */}
      <div>
        <SectionHeader title="Nodes" icon={Server} action={() => onView('vms')} actionLabel="Manage" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nodes.map((n) => (
            <NodeCard key={n.node} node={n} />
          ))}
        </div>
      </div>

      {/* Quick access: running guests */}
      <div>
        <SectionHeader title="Running Guests" icon={Zap} action={() => onView('vms')} actionLabel="All guests" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {running.slice(0, 8).map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              className="panel panel-hover p-3.5 text-left animate-fade-in group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    r.type === 'qemu' ? 'bg-brand-500/15 text-brand-400' : 'bg-accent-500/15 text-accent-400'
                  }`}
                >
                  <span className="text-[10px] font-bold font-mono">{r.vmid}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink-100 truncate">{r.name}</div>
                  <div className="text-[11px] text-ink-400">{r.node} · {r.type === 'qemu' ? 'VM' : 'LXC'}</div>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot(r.status)}`} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <Mini label="CPU" value={`${Math.round(r.cpu * 100)}%`} p={r.cpu * 100} color="bg-brand-500" />
                <Mini label="MEM" value={formatBytes(r.memory)} p={pct(r.memory, r.maxmem)} color="bg-accent-500" />
              </div>
            </button>
          ))}
          {!running.length && <p className="text-sm text-ink-400 col-span-full">No running guests.</p>}
        </div>
      </div>

      {/* Storage summary */}
      <div>
        <SectionHeader title="Storage Pools" icon={HardDrive} action={() => onView('storage')} actionLabel="Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storage.slice(0, 6).map((s) => {
            const p = pct(s.used, s.total);
            return (
              <div key={s.id} className="panel p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-ink-100">{s.storage}</div>
                    <div className="text-[11px] text-ink-400">{s.node} · {s.type}</div>
                  </div>
                  <span className="chip bg-ink-700/40 text-ink-300 border border-white/10">{s.active ? 'active' : 'inactive'}</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-ink-400 mb-1">
                    <span>{formatBytes(s.used)} / {formatBytes(s.total)}</span>
                    <span className="font-mono">{p.toFixed(0)}%</span>
                  </div>
                  <UsageBar used={p} total={100} color={p > 85 ? 'bg-danger-500' : p > 65 ? 'bg-warn-500' : 'bg-success-500'} height="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeroCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  iconColor,
}: {
  icon: typeof Server;
  label: string;
  value: number;
  sub: string;
  color: string;
  iconColor: string;
}) {
  return (
    <div className={`panel p-5 relative overflow-hidden bg-gradient-to-br ${color}`}>
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs text-ink-300 uppercase tracking-wide">{label}</div>
          <div className="text-3xl font-bold text-ink-100 mt-1">{value}</div>
          <div className="text-xs text-ink-400 mt-1">{sub}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function ClusterStat({
  icon: Icon,
  label,
  value,
  series,
  color,
  detail,
}: {
  icon: typeof Cpu;
  label: string;
  value: number;
  series: number[];
  color: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <RadialGauge value={value} size={72} stroke={6} color={color} label={label} />
      <div className="mt-2 flex items-center gap-1.5 text-ink-400">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs">{detail ?? `${Math.round(value * 100)}%`}</span>
      </div>
      <div className="mt-1">
        <Sparkline values={series} color={color} width={90} height={24} />
      </div>
    </div>
  );
}

function NodeCard({ node }: { node: ProxmoxNode }) {
  const cpuPct = node.cpu;
  const memPct = node.memory / Math.max(1, node.maxmem);
  const diskPct = node.disk / Math.max(1, node.maxdisk);
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ink-700/60 flex items-center justify-center">
            <Server className="w-5 h-5 text-ink-200" />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink-100">{node.node}</div>
            <div className="text-[11px] text-ink-400 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'online' ? 'bg-success-500' : 'bg-danger-500'}`} />
              {node.status} · up {formatUptime(node.uptime)}
            </div>
          </div>
        </div>
        {node.loadavg && (
          <div className="text-right">
            <div className="text-[11px] text-ink-400">load avg</div>
            <div className="text-xs font-mono text-ink-200">{node.loadavg[0].toFixed(2)}</div>
          </div>
        )}
      </div>
      <div className="mt-4 space-y-3">
        <NodeRow icon={Cpu} label="CPU" value={`${Math.round(cpuPct * 100)}%`} p={cpuPct * 100} color="bg-brand-500" />
        <NodeRow icon={MemoryStick} label="Memory" value={`${formatBytes(node.memory)} / ${formatBytes(node.maxmem)}`} p={memPct * 100} color="bg-accent-500" />
        <NodeRow icon={HardDrive} label="Disk" value={`${formatBytes(node.disk)} / ${formatBytes(node.maxdisk)}`} p={diskPct * 100} color="bg-success-500" />
      </div>
    </div>
  );
}

function NodeRow({ icon: Icon, label, value, p, color }: { icon: typeof Cpu; label: string; value: string; p: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-ink-400 mb-1">
        <span className="flex items-center gap-1.5"><Icon className="w-3 h-3" /> {label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <UsageBar used={p} total={100} color={color} />
    </div>
  );
}

function Mini({ label, value, p, color }: { label: string; value: string; p: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-ink-400">{label}</span>
        <span className="font-mono text-ink-200">{value}</span>
      </div>
      <UsageBar used={p} total={100} color={color} height="h-1" />
    </div>
  );
}

function SectionHeader({ title, icon: Icon, action, actionLabel }: { title: string; icon: typeof Server; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-ink-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-ink-400" />
        {title}
      </h3>
      {action && (
        <button onClick={action} className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
          {actionLabel} <Clock className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
