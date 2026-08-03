import { X, Play, Square, Power, RotateCw, Pause, FastForward, Terminal, Cpu, MemoryStick, HardDrive, Network, Clock, Tag, Server, Activity } from 'lucide-react';
import type { ProxmoxResource } from '../types';
import type { VMAction } from '../proxmox';
import { formatBytes, formatUptime, pct, statusBg, statusDot } from '../utils';
import { UsageBar, RadialGauge, Sparkline } from './Visuals';

export function ResourceDrawer({
  resource,
  onClose,
  onAction,
  onConsole,
}: {
  resource: ProxmoxResource | null;
  onClose: () => void;
  onAction: (vmid: number, action: VMAction) => void;
  onConsole: () => void;
}) {
  if (!resource) return null;

  const cpuPct = pct(resource.cpu, 1);
  const memPct = pct(resource.memory, resource.maxmem);
  const diskPct = pct(resource.disk, resource.maxdisk);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-ink-850 border-l border-white/[0.08] shadow-pop overflow-y-auto scrollbar-thin animate-slide-in">
        <div className="sticky top-0 z-10 bg-ink-850/95 backdrop-blur-xl border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${resource.type === 'qemu' ? 'bg-brand-500/15 text-brand-400' : 'bg-accent-500/15 text-accent-400'}`}>
                <span className="text-sm font-bold font-mono">{resource.vmid}</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink-100">{resource.name}</h2>
                <div className="flex items-center gap-2 text-xs text-ink-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot(resource.status)}`} />
                  <span className="capitalize">{resource.status}</span>
                  <span>·</span>
                  <span className="uppercase">{resource.type === 'qemu' ? 'VM' : 'LXC'}</span>
                  <span>·</span>
                  <span>{resource.node}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost -mr-2"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Action toolbar */}
          <div className="flex flex-wrap gap-2">
            {resource.status === 'stopped' && (
              <button onClick={() => onAction(resource.vmid, 'start')} className="btn btn-primary flex-1"><Play className="w-4 h-4" /> Start</button>
            )}
            {resource.status === 'running' && (
              <>
                <button onClick={() => onAction(resource.vmid, 'shutdown')} className="btn btn-ghost flex-1"><Power className="w-4 h-4" /> Shutdown</button>
                <button onClick={() => onAction(resource.vmid, 'reboot')} className="btn btn-ghost flex-1"><RotateCw className="w-4 h-4" /> Reboot</button>
                <button onClick={() => onAction(resource.vmid, 'stop')} className="btn btn-danger flex-1"><Square className="w-4 h-4" /> Stop</button>
                <button onClick={() => onAction(resource.vmid, 'suspend')} className="btn btn-ghost flex-1"><Pause className="w-4 h-4" /> Suspend</button>
              </>
            )}
            {resource.status === 'paused' && (
              <button onClick={() => onAction(resource.vmid, 'resume')} className="btn btn-primary flex-1"><Play className="w-4 h-4" /> Resume</button>
            )}
            {resource.status !== 'stopped' && (
              <button onClick={() => onAction(resource.vmid, 'reset')} className="btn btn-ghost flex-1"><FastForward className="w-4 h-4" /> Reset</button>
            )}
          </div>

          <button onClick={onConsole} className="btn btn-ghost w-full border border-white/10 bg-ink-900/40">
            <Terminal className="w-4 h-4 text-brand-400" /> Open Console
          </button>

          {/* Gauges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="panel p-4 flex flex-col items-center">
              <RadialGauge value={cpuPct / 100} size={64} stroke={5} color="#3aa0ff" label="CPU" />
              <span className="text-[11px] text-ink-400 mt-2">{resource.cpus} cores</span>
            </div>
            <div className="panel p-4 flex flex-col items-center">
              <RadialGauge value={memPct / 100} size={64} stroke={5} color="#22d3ee" label="MEM" />
              <span className="text-[11px] text-ink-400 mt-2">{formatBytes(resource.memory)}</span>
            </div>
            <div className="panel p-4 flex flex-col items-center">
              <RadialGauge value={diskPct / 100} size={64} stroke={5} color="#10b981" label="DISK" />
              <span className="text-[11px] text-ink-400 mt-2">
                {resource.status === 'stopped'
                  ? (resource.lastDiskUsage
                      ? `${formatBytes(resource.lastDiskUsage)} used`
                      : resource.allocatedDisk
                        ? `${formatBytes(resource.allocatedDisk)} alloc`
                        : '—')
                  : formatBytes(resource.disk)}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="panel p-4 space-y-3">
            <DetailRow icon={Server} label="VMID" value={String(resource.vmid)} />
            <DetailRow icon={Server} label="Type" value={resource.type === 'qemu' ? 'QEMU (KVM)' : 'LXC Container'} />
            <DetailRow icon={Server} label="Node" value={resource.node} />
            <DetailRow icon={Clock} label="Uptime" value={formatUptime(resource.uptime)} />
            <DetailRow icon={Activity} label="Status" value={resource.status} />
            {resource.tags && <DetailRow icon={Tag} label="Tags" value={resource.tags.split(';').join(', ')} />}
            {resource.pid != null && <DetailRow icon={Activity} label="PID" value={String(resource.pid)} />}
          </div>

          {/* Resource usage */}
          <div className="panel p-4 space-y-4">
            <h3 className="text-xs uppercase tracking-wide text-ink-400 font-medium">Resource Usage</h3>
            <UsageRow icon={Cpu} label="CPU" value={`${Math.round(cpuPct)}%`} detail={`${resource.cpus} / cores`} p={cpuPct} color="bg-brand-500" />
            <UsageRow icon={MemoryStick} label="Memory" value={`${formatBytes(resource.memory)} / ${formatBytes(resource.maxmem)}`} detail={`${memPct.toFixed(1)}%`} p={memPct} color="bg-accent-500" />
            <UsageRow icon={HardDrive} label="Disk" value={resource.status === 'stopped' ? (resource.lastDiskUsage ? `${formatBytes(resource.lastDiskUsage)} used (cached)` : resource.allocatedDisk ? `${formatBytes(resource.allocatedDisk)} allocated` : '—') : `${formatBytes(resource.disk)} / ${formatBytes(resource.maxdisk)}`} detail={`${diskPct.toFixed(1)}%`} p={diskPct} color="bg-success-500" />
          </div>

          {/* Disk breakdown from config */}
          {resource.disks && resource.disks.length > 0 && (
            <div className="panel p-4 space-y-3">
              <h3 className="text-xs uppercase tracking-wide text-ink-400 font-medium">Disk Volumes</h3>
              {resource.disks.map((d) => (
                <div key={d.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-ink-400" />
                    <span className="font-mono text-xs text-ink-200">{d.key}</span>
                    <span className="chip bg-ink-700/40 text-ink-300 border border-white/10 text-[10px]">{d.storage}</span>
                  </div>
                  <span className="font-mono text-xs text-ink-100">{formatBytes(d.size)}</span>
                </div>
              ))}
            </div>
          )}

          {resource.status === 'stopped' && resource.lastDiskUsageTime && (
            <div className="panel p-4">
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Last live disk reading: {new Date(resource.lastDiskUsageTime).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Network & IO */}
          <div className="panel p-4 space-y-3">
            <h3 className="text-xs uppercase tracking-wide text-ink-400 font-medium">Network & Disk I/O</h3>
            <DetailRow icon={Network} label="Net In" value={formatBytes(resource.netin)} />
            <DetailRow icon={Network} label="Net Out" value={formatBytes(resource.netout)} />
            <DetailRow icon={HardDrive} label="Disk Read" value={formatBytes(resource.diskread)} />
            <DetailRow icon={HardDrive} label="Disk Write" value={formatBytes(resource.diskwrite)} />
          </div>

          {/* Mini charts */}
          <div className="panel p-4">
            <h3 className="text-xs uppercase tracking-wide text-ink-400 font-medium mb-3">Activity (snapshot)</h3>
            <div className="space-y-3">
              <ChartRow label="CPU" values={[resource.cpu * 100, resource.cpu * 80, resource.cpu * 60, resource.cpu * 90, resource.cpu * 100]} color="#3aa0ff" />
              <ChartRow label="Memory" values={[memPct * 0.7, memPct * 0.8, memPct * 0.85, memPct * 0.9, memPct]} color="#22d3ee" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Server; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-ink-400"><Icon className="w-3.5 h-3.5" /> {label}</span>
      <span className="text-ink-100 font-medium font-mono text-xs">{value}</span>
    </div>
  );
}

function UsageRow({ icon: Icon, label, value, detail, p, color }: { icon: typeof Cpu; label: string; value: string; detail: string; p: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="flex items-center gap-1.5 text-ink-300"><Icon className="w-3.5 h-3.5" /> {label}</span>
        <span className="text-ink-400 font-mono">{detail}</span>
      </div>
      <UsageBar used={p} total={100} color={color} height="h-2" />
      <div className="text-[11px] text-ink-400 mt-1 font-mono">{value}</div>
    </div>
  );
}

function ChartRow({ label, values, color }: { label: string; values: number[]; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-ink-400 w-12 shrink-0">{label}</span>
      <Sparkline values={values} color={color} width={220} height={28} />
    </div>
  );
}
