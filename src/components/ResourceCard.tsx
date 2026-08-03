import { Play, Square, RotateCw, Power, Pause, FastForward } from 'lucide-react';
import type { ProxmoxResource } from '../types';
import type { VMAction } from '../proxmox';
import { formatBytes, formatUptime, pct, statusBg, statusDot } from '../utils';
import { UsageBar, RadialGauge } from './Visuals';

export function ResourceCard({
  resource,
  onAction,
  onSelect,
}: {
  resource: ProxmoxResource;
  onAction: (vmid: number, action: VMAction) => void;
  onSelect?: (r: ProxmoxResource) => void;
}) {
  const isRunning = resource.status === 'running';
  const isPaused = resource.status === 'paused';
  const isStopped = resource.status === 'stopped';

  const cpuPct = pct(resource.cpu, 1);
  const memPct = pct(resource.memory, resource.maxmem);
  const diskPct = pct(resource.disk, resource.maxdisk);

  return (
    <div
      onClick={() => onSelect?.(resource)}
      className="panel panel-hover p-4 cursor-pointer group animate-fade-in relative overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  resource.type === 'qemu'
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'bg-accent-500/15 text-accent-400'
                }`}
              >
                <span className="text-xs font-bold font-mono">{resource.vmid}</span>
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-ink-850 ${statusDot(resource.status)}`} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink-100 truncate">{resource.name}</div>
              <div className="flex items-center gap-2 text-[11px] text-ink-400">
                <span className="uppercase">{resource.type === 'qemu' ? 'VM' : 'LXC'}</span>
                <span>·</span>
                <span>{resource.node}</span>
                {resource.tags && (
                  <>
                    <span>·</span>
                    <span className="truncate">{resource.tags.split(';').join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className={`chip ${statusBg(resource.status)} shrink-0`}>
            <span className="capitalize">{resource.status}</span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Gauge label="CPU" value={cpuPct / 100} sub={`${resource.cpus} cores`} color="#3aa0ff" />
          <Gauge label="MEM" value={memPct / 100} sub={formatBytes(resource.memory)} color="#22d3ee" />
          <Gauge
            label="DISK"
            value={diskPct / 100}
            sub={
              resource.status === 'stopped'
                ? (resource.lastDiskUsage
                    ? `${formatBytes(resource.lastDiskUsage)} used`
                    : resource.allocatedDisk
                      ? `${formatBytes(resource.allocatedDisk)} alloc`
                      : '—')
                : formatBytes(resource.disk)
            }
            color="#10b981"
          />
        </div>

        <div className="mt-3 space-y-2">
          <Row label="Memory" value={`${formatBytes(resource.memory)} / ${formatBytes(resource.maxmem)}`} p={memPct} color="bg-accent-500" />
          <Row label="Disk" value={`${formatBytes(resource.disk)} / ${formatBytes(resource.maxdisk)}`} p={diskPct} color="bg-success-500" />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-ink-400">
          <span>Uptime {formatUptime(resource.uptime)}</span>
          <span>↓ {formatBytes(resource.netin)} · ↑ {formatBytes(resource.netout)}</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {isStopped && (
            <ActionBtn onClick={() => onAction(resource.vmid, 'start')} icon={Play} label="Start" tone="primary" />
          )}
          {isRunning && (
            <>
              <ActionBtn onClick={() => onAction(resource.vmid, 'shutdown')} icon={Power} label="Shutdown" tone="ghost" />
              <ActionBtn onClick={() => onAction(resource.vmid, 'stop')} icon={Square} label="Stop" tone="danger" />
              <ActionBtn onClick={() => onAction(resource.vmid, 'reboot')} icon={RotateCw} label="Reboot" tone="ghost" />
              <ActionBtn onClick={() => onAction(resource.vmid, 'suspend')} icon={Pause} label="Suspend" tone="ghost" />
            </>
          )}
          {isPaused && (
            <>
              <ActionBtn onClick={() => onAction(resource.vmid, 'resume')} icon={Play} label="Resume" tone="primary" />
              <ActionBtn onClick={() => onAction(resource.vmid, 'stop')} icon={Square} label="Stop" tone="danger" />
            </>
          )}
          {!isStopped && (
            <ActionBtn onClick={() => onAction(resource.vmid, 'reset')} icon={FastForward} label="Reset" tone="ghost" />
          )}
        </div>
      </div>
    </div>
  );
}

function Gauge({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <RadialGauge value={value} size={52} stroke={4} color={color} label={label} />
      <span className="text-[10px] text-ink-400 truncate max-w-full">{sub}</span>
    </div>
  );
}

function Row({ label, value, p, color }: { label: string; value: string; p: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-ink-400 mb-1">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <UsageBar used={p} total={100} color={color} />
    </div>
  );
}

function ActionBtn({
  onClick,
  icon: Icon,
  label,
  tone,
}: {
  onClick: () => void;
  icon: typeof Play;
  label: string;
  tone: 'primary' | 'danger' | 'ghost';
}) {
  const cls = tone === 'primary' ? 'btn-primary' : tone === 'danger' ? 'btn-danger' : 'btn-ghost';
  return (
    <button onClick={onClick} className={`btn ${cls} flex-1 text-xs px-2 py-1.5`} title={label}>
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
