import { HardDrive, Database, Archive, Layers, ChevronDown, ChevronUp, Server } from 'lucide-react';
import { useState } from 'react';
import type { ProxmoxResource, ProxmoxStorage } from '../types';
import { formatBytes, pct } from '../utils';
import { UsageBar } from './Visuals';

const typeIcon: Record<string, typeof HardDrive> = {
  lvm: Layers,
  lvmthin: Layers,
  zfs: Database,
  dir: HardDrive,
  rbd: Archive,
  nfs: Archive,
  cephfs: Database,
};

export function StorageView({
  storage,
  resources,
}: {
  storage: ProxmoxStorage[];
  resources: ProxmoxResource[];
}) {
  // Group storage by node
  const byNode = new Map<string, ProxmoxStorage[]>();
  for (const s of storage) {
    const arr = byNode.get(s.node) ?? [];
    arr.push(s);
    byNode.set(s.node, arr);
  }

  return (
    <div className="space-y-6 animate-fade-in">
    {Array.from(byNode.entries()).map(([node, pools]) => (
      <div key={node}>
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-100">{node}</h3>
          <span className="text-xs text-ink-400">· {pools.length} storage pool{pools.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pools.map((s) => (
            <StorageCard key={s.id} storage={s} resources={resources} />
          ))}
        </div>
      </div>
    ))}
    {!storage.length && <p className="text-sm text-ink-400">No storage pools found.</p>}
  </div>
  );
}

function StorageCard({ storage, resources }: { storage: ProxmoxStorage; resources: ProxmoxResource[] }) {
  const [expanded, setExpanded] = useState(false);
  const p = pct(storage.used, storage.total);
  const Icon = typeIcon[storage.type] ?? HardDrive;
  const tone = p > 85 ? 'danger' : p > 65 ? 'warn' : 'success';
  const barColor = tone === 'danger' ? 'bg-danger-500' : tone === 'warn' ? 'bg-warn-500' : 'bg-success-500';

  // Find guests whose disks are on this storage
  const guestsOnStorage = resources.filter((r) =>
    r.node === storage.node && r.disks?.some((d) => d.storage === storage.storage),
  );
  const allocatedByGuests = guestsOnStorage.reduce((sum, r) => {
    const onThisStorage = (r.disks ?? []).filter((d) => d.storage === storage.storage).reduce((s, d) => s + d.size, 0);
    return sum + onThisStorage;
  }, 0);
  const free = Math.max(0, storage.total - storage.used);

  return (
    <div className="panel panel-hover">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-700/60 flex items-center justify-center">
              <Icon className="w-5 h-5 text-ink-200" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-100">{storage.storage}</div>
              <div className="text-[11px] text-ink-400">{storage.node} · {storage.type}</div>
            </div>
          </div>
          <span className={`chip ${storage.active ? 'bg-success-500/15 text-success-400 border border-success-500/25' : 'bg-ink-700/40 text-ink-400 border border-white/10'}`}>
            {storage.active ? 'active' : 'inactive'}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-ink-300">{formatBytes(storage.used)} <span className="text-ink-400">/ {formatBytes(storage.total)}</span></span>
            <span className={`font-mono font-semibold ${tone === 'danger' ? 'text-danger-400' : tone === 'warn' ? 'text-warn-400' : 'text-success-400'}`}>{p.toFixed(1)}%</span>
          </div>
          <UsageBar used={p} total={100} color={barColor} height="h-2.5" />
        </div>

        {/* Usage breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-ink-900/40 p-2">
            <div className="text-[10px] uppercase text-ink-400">Used</div>
            <div className="text-xs font-mono font-semibold text-ink-100">{formatBytes(storage.used)}</div>
          </div>
          <div className="rounded-lg bg-ink-900/40 p-2">
            <div className="text-[10px] uppercase text-ink-400">Free</div>
            <div className="text-xs font-mono font-semibold text-success-400">{formatBytes(free)}</div>
          </div>
          <div className="rounded-lg bg-ink-900/40 p-2">
            <div className="text-[10px] uppercase text-ink-400">Guests</div>
            <div className="text-xs font-mono font-semibold text-ink-100">{guestsOnStorage.length}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {storage.content.split(',').map((c) => (
            <span key={c} className="chip bg-ink-700/40 text-ink-300 border border-white/10">{c}</span>
          ))}
        </div>

        {guestsOnStorage.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-4 flex items-center justify-between text-xs text-ink-400 hover:text-ink-200 transition-colors"
          >
            <span>{guestsOnStorage.length} guest{guestsOnStorage.length !== 1 ? 's' : ''} on this storage · {formatBytes(allocatedByGuests)} allocated</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && guestsOnStorage.length > 0 && (
        <div className="border-t border-white/[0.06] px-5 py-3 space-y-2 animate-fade-in">
          {guestsOnStorage.map((g) => {
            const disksOnStorage = (g.disks ?? []).filter((d) => d.storage === storage.storage);
            const totalAllocated = disksOnStorage.reduce((s, d) => s + d.size, 0);
            return (
              <div key={g.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${g.status === 'running' ? 'bg-success-500' : 'bg-ink-500'}`} />
                  <span className="text-ink-100 truncate">{g.name}</span>
                  <span className="text-ink-500 font-mono shrink-0">{g.vmid}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-ink-400">{disksOnStorage.map((d) => d.key).join(', ')}</span>
                  <span className="font-mono text-ink-200">{formatBytes(totalAllocated)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
