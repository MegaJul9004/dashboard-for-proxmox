import { Play, Square, Power, RotateCw, Pause, FastForward, ChevronUp, ChevronDown, Cpu, MemoryStick, HardDrive, Network } from 'lucide-react';
import { useState } from 'react';
import type { ProxmoxResource } from '../types';
import type { VMAction } from '../proxmox';
import { formatBytes, formatUptime, pct, statusBg, statusDot } from '../utils';
import { UsageBar } from './Visuals';

type SortKey = 'name' | 'vmid' | 'status' | 'cpu' | 'mem' | 'uptime' | 'node';

export function ResourceList({
  resources,
  onAction,
  onSelect,
}: {
  resources: ProxmoxResource[];
  onAction: (vmid: number, action: VMAction) => void;
  onSelect: (r: ProxmoxResource) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'status', dir: 'desc' });

  const sorted = [...resources].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    switch (sort.key) {
      case 'name': return a.name.localeCompare(b.name) * dir;
      case 'vmid': return (a.vmid - b.vmid) * dir;
      case 'status': return a.status.localeCompare(b.status) * dir;
      case 'cpu': return (a.cpu - b.cpu) * dir;
      case 'mem': return (a.memory - b.memory) * dir;
      case 'uptime': return (a.uptime - b.uptime) * dir;
      case 'node': return a.node.localeCompare(b.node) * dir;
    }
  });

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  return (
    <div className="panel overflow-hidden animate-fade-in">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-ink-400 border-b border-white/[0.06]">
              <Th label="ID" sortKey="vmid" sort={sort} onSort={toggleSort} />
              <Th label="Name" sortKey="name" sort={sort} onSort={toggleSort} />
              <Th label="Node" sortKey="node" sort={sort} onSort={toggleSort} />
              <Th label="Status" sortKey="status" sort={sort} onSort={toggleSort} />
              <th className="px-3 py-3 font-medium"><Cpu className="w-3.5 h-3.5 inline" /> CPU</th>
              <th className="px-3 py-3 font-medium hidden md:table-cell"><MemoryStick className="w-3.5 h-3.5 inline" /> Memory</th>
              <th className="px-3 py-3 font-medium hidden lg:table-cell"><HardDrive className="w-3.5 h-3.5 inline" /> Disk</th>
              <th className="px-3 py-3 font-medium hidden lg:table-cell"><Network className="w-3.5 h-3.5 inline" /> Net I/O</th>
              <Th label="Uptime" sortKey="uptime" sort={sort} onSort={toggleSort} className="hidden md:table-cell" />
              <th className="px-3 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr
                key={r.id}
                onClick={() => onSelect(r)}
                className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer group"
              >
                <td className="px-3 py-3">
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                    r.type === 'qemu' ? 'bg-brand-500/15 text-brand-400' : 'bg-accent-500/15 text-accent-400'
                  }`}>{r.vmid}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot(r.status)}`} />
                    <div>
                      <div className="font-medium text-ink-100">{r.name}</div>
                      {r.tags && <div className="text-[10px] text-ink-400">{r.tags.split(';').join(' · ')}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-ink-300 text-xs">{r.node}</td>
                <td className="px-3 py-3">
                  <span className={`chip ${statusBg(r.status)}`}>
                    <span className="capitalize">{r.status}</span>
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="w-20">
                    <div className="text-[11px] text-ink-400 mb-0.5">{Math.round(r.cpu * 100)}% · {r.cpus}c</div>
                    <UsageBar used={r.cpu * 100} total={100} color="bg-brand-500" height="h-1" />
                  </div>
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <div className="w-24">
                    <div className="text-[11px] text-ink-400 mb-0.5">{formatBytes(r.memory)}</div>
                    <UsageBar used={pct(r.memory, r.maxmem)} total={100} color="bg-accent-500" height="h-1" />
                  </div>
                </td>
                <td className="px-3 py-3 hidden lg:table-cell text-[11px] text-ink-300 font-mono" title={r.status === 'stopped' && r.lastDiskUsageTime ? `Last live reading: ${new Date(r.lastDiskUsageTime).toLocaleString()}` : undefined}>
                  {r.status === 'stopped'
                    ? (r.lastDiskUsage
                        ? `${formatBytes(r.lastDiskUsage)}${r.allocatedDisk ? ` / ${formatBytes(r.allocatedDisk)}` : ''}`
                        : (r.allocatedDisk ? `${formatBytes(r.allocatedDisk)} alloc` : '—'))
                    : formatBytes(r.disk)}
                </td>
                <td className="px-3 py-3 hidden lg:table-cell text-[11px] text-ink-300 font-mono">
                  ↓{formatBytes(r.netin)} ↑{formatBytes(r.netout)}
                </td>
                <td className="px-3 py-3 hidden md:table-cell text-[11px] text-ink-400">{formatUptime(r.uptime)}</td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    {r.status === 'stopped' && (
                      <IconBtn onClick={() => onAction(r.vmid, 'start')} icon={Play} tone="primary" title="Start" />
                    )}
                    {r.status === 'running' && (
                      <>
                        <IconBtn onClick={() => onAction(r.vmid, 'shutdown')} icon={Power} title="Shutdown" />
                        <IconBtn onClick={() => onAction(r.vmid, 'reboot')} icon={RotateCw} title="Reboot" />
                        <IconBtn onClick={() => onAction(r.vmid, 'stop')} icon={Square} tone="danger" title="Stop" />
                        <IconBtn onClick={() => onAction(r.vmid, 'suspend')} icon={Pause} title="Suspend" />
                      </>
                    )}
                    {r.status === 'paused' && (
                      <IconBtn onClick={() => onAction(r.vmid, 'resume')} icon={Play} tone="primary" title="Resume" />
                    )}
                    {r.status !== 'stopped' && (
                      <IconBtn onClick={() => onAction(r.vmid, 'reset')} icon={FastForward} title="Reset" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!sorted.length && (
              <tr>
                <td colSpan={10} className="px-3 py-10 text-center text-ink-400 text-sm">No resources found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  label,
  sortKey,
  sort,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: 'asc' | 'desc' };
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th className={`px-3 py-3 font-medium ${className}`}>
      <button onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 hover:text-ink-200 transition-colors ${active ? 'text-ink-100' : ''}`}>
        {label}
        {active && (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
    </th>
  );
}

function IconBtn({
  onClick,
  icon: Icon,
  tone = 'ghost',
  title,
}: {
  onClick: () => void;
  icon: typeof Play;
  tone?: 'primary' | 'danger' | 'ghost';
  title: string;
}) {
  const cls = tone === 'primary' ? 'text-success-400 hover:bg-success-500/15' : tone === 'danger' ? 'text-danger-400 hover:bg-danger-500/15' : 'text-ink-300 hover:bg-white/10';
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md transition-colors ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
