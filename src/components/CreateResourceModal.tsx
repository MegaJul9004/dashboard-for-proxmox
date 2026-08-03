import { useEffect, useState } from 'react';
import { X, Server, Boxes, Cpu, MemoryStick, HardDrive, Hash, Globe, Package, Loader2, AlertCircle } from 'lucide-react';
import type { ProxmoxNode, ProxmoxStorage } from '../types';

export interface CreateFormData {
  type: 'qemu' | 'lxc';
  node: string;
  vmid: number;
  name: string;
  cores: number;
  memory: number; // MB
  disk: number; // GB
  storage: string;
  ostemplate?: string;
}

export function CreateResourceModal({
  open,
  onClose,
  onCreate,
  nodes,
  storage,
  getNextVMID,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateFormData) => Promise<void>;
  nodes: ProxmoxNode[];
  storage: ProxmoxStorage[];
  getNextVMID: () => Promise<number>;
  defaultType: 'qemu' | 'lxc';
}) {
  const [type, setType] = useState<'qemu' | 'lxc'>(defaultType);
  const [node, setNode] = useState('');
  const [vmid, setVmid] = useState(100);
  const [name, setName] = useState('');
  const [cores, setCores] = useState(2);
  const [memory, setMemory] = useState(2048);
  const [disk, setDisk] = useState(20);
  const [storageName, setStorageName] = useState('');
  const [ostemplate, setOstemplate] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setType(defaultType);
      setError(null);
      setCreating(false);
      const firstNode = nodes[0]?.node ?? '';
      setNode(firstNode);
      getNextVMID().then((id) => setVmid(id)).catch(() => {});
      // pick first storage that supports the right content type
      const suitable = storage.find((s) =>
        defaultType === 'lxc' ? s.content.includes('rootdir') || s.content.includes('images') : s.content.includes('images'),
      );
      setStorageName(suitable?.storage ?? storage[0]?.storage ?? 'local-lvm');
    }
  }, [open, defaultType, nodes, storage, getNextVMID]);

  useEffect(() => {
    if (open && node) {
      const suitable = storage.filter((s) =>
        type === 'lxc' ? s.content.includes('rootdir') || s.content.includes('images') : s.content.includes('images'),
      );
      if (suitable.length && !suitable.find((s) => s.storage === storageName)) {
        setStorageName(suitable[0].storage);
      }
    }
  }, [type, node, open, storage, storageName]);

  if (!open) return null;

  const availableStorage = storage.filter((s) =>
    s.node === node && (type === 'lxc' ? s.content.includes('rootdir') || s.content.includes('images') : s.content.includes('images')),
  );

  const handleSubmit = async () => {
    if (!name.trim() || !node || !storageName) {
      setError('Please fill in all required fields.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await onCreate({
        type,
        node,
        vmid,
        name: name.trim(),
        cores,
        memory,
        disk,
        storage: storageName,
        ostemplate: type === 'lxc' ? ostemplate.trim() || undefined : undefined,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto scrollbar-thin panel p-6 animate-scale-in shadow-pop">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center">
              {type === 'qemu' ? <Server className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-100">Create New {type === 'qemu' ? 'Virtual Machine' : 'LXC Container'}</h2>
              <p className="text-xs text-ink-400">Configure and deploy a new guest</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost -mr-2"><X className="w-4 h-4" /></button>
        </div>

        {/* Type toggle */}
        <div className="flex items-center gap-2 p-1 rounded-lg bg-ink-800/60 border border-white/[0.06] mb-5">
          <button
            onClick={() => setType('qemu')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${type === 'qemu' ? 'bg-brand-500/20 text-brand-300' : 'text-ink-400 hover:text-ink-200'}`}
          >
            <Server className="w-4 h-4" /> Virtual Machine
          </button>
          <button
            onClick={() => setType('lxc')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${type === 'lxc' ? 'bg-accent-500/20 text-accent-300' : 'text-ink-400 hover:text-ink-200'}`}
          >
            <Boxes className="w-4 h-4" /> LXC Container
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label icon={Globe} text="Node" />
              <select value={node} onChange={(e) => setNode(e.target.value)} className="input">
                {nodes.map((n) => (
                  <option key={n.node} value={n.node} className="bg-ink-850">{n.node}</option>
                ))}
              </select>
            </div>
            <div>
              <Label icon={Hash} text="VM ID" />
              <input type="number" value={vmid} onChange={(e) => setVmid(Number(e.target.value))} className="input font-mono" />
            </div>
          </div>

          <div>
            <Label icon={Server} text="Name" />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-container" className="input" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label icon={Cpu} text="Cores" />
              <input type="number" value={cores} min={1} max={64} onChange={(e) => setCores(Number(e.target.value))} className="input" />
            </div>
            <div>
              <Label icon={MemoryStick} text="Memory (MB)" />
              <input type="number" value={memory} min={128} step={128} onChange={(e) => setMemory(Number(e.target.value))} className="input" />
            </div>
            <div>
              <Label icon={HardDrive} text="Disk (GB)" />
              <input type="number" value={disk} min={1} onChange={(e) => setDisk(Number(e.target.value))} className="input" />
            </div>
          </div>

          <div>
            <Label icon={HardDrive} text="Storage" />
            <select value={storageName} onChange={(e) => setStorageName(e.target.value)} className="input">
              {availableStorage.length === 0 && (
                <option value="" className="bg-ink-850">No suitable storage</option>
              )}
              {availableStorage.map((s) => (
                <option key={s.id} value={s.storage} className="bg-ink-850">
                  {s.storage} ({s.type})
                </option>
              ))}
            </select>
          </div>

          {type === 'lxc' && (
            <div>
              <Label icon={Package} text="OS Template (volid)" />
              <input
                value={ostemplate}
                onChange={(e) => setOstemplate(e.target.value)}
                placeholder="local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst"
                className="input font-mono text-xs"
              />
              <p className="text-[11px] text-ink-400 mt-1">Find templates in Proxmox under your storage's CT templates section.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-xs text-danger-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={creating} className="btn btn-primary">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
            {creating ? 'Creating…' : `Create ${type === 'qemu' ? 'VM' : 'Container'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ icon: Icon, text }: { icon: typeof Server; text: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">
      <Icon className="w-3 h-3" /> {text}
    </div>
  );
}
