import { useState, useEffect, useRef } from 'react';
import { X, Terminal, Trash2, ChevronRight } from 'lucide-react';
import type { ProxmoxResource } from '../types';

interface LogLine {
  time: string;
  text: string;
  kind: 'info' | 'action' | 'error';
}

const bootLines = [
  'Booting from Hard Disk...',
  'SeaBIOS (version rel-1.16.3-0-gd6cd3b1cb4e-prebuilt.qemu.org)',
  'Booting from DVD/CD...',
  'Press a key to install, or wait for 3s to boot from hard disk',
  'Starting kernel...',
  '[    0.000000] Linux version 6.8.0-45-generic',
  '[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz root=/dev/mapper/pve-root ro quiet',
  '[    0.012345] Memory: 16400000K/16777216K available',
  '[    0.234567] systemd[1]: Detected architecture x86-64.',
  '[    0.345678] systemd[1]: Set hostname to <pve1>.',
  '[    1.123456] systemd[1]: Started Daily Cleanup of Temporary Directories.',
  '[    1.234567] systemd[1]: Reached target Multi-User System.',
  '[    1.345678] systemd[1]: Reached target Graphical Interface.',
  'login: ',
];

export function ConsoleModal({
  open,
  onClose,
  resource,
}: {
  open: boolean;
  onClose: () => void;
  resource: ProxmoxResource | null;
}) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !resource) return;
    setLines([]);
    setInput('');
    if (resource.status === 'running') {
      let i = 0;
      const timer = setInterval(() => {
        if (i < bootLines.length) {
          setLines((prev) => [...prev, { time: new Date().toLocaleTimeString(), text: bootLines[i], kind: 'info' }]);
          i++;
        } else {
          clearInterval(timer);
        }
      }, 180);
      return () => clearInterval(timer);
    } else {
      setLines([{ time: new Date().toLocaleTimeString(), text: `Guest ${resource.name} (VMID ${resource.vmid}) is ${resource.status}.`, kind: 'error' }]);
    }
  }, [open, resource]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (!open || !resource) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLines((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), text: `root@${resource.name}:~# ${input}`, kind: 'action' },
      { time: new Date().toLocaleTimeString(), text: `bash: ${input.split(' ')[0]}: simulated response (demo console)`, kind: 'info' },
    ]);
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-3xl h-[70vh] panel p-0 overflow-hidden animate-scale-in shadow-pop flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-ink-900/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-danger-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-warn-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-200">
              <Terminal className="w-4 h-4 text-brand-400" />
              <span className="font-mono">root@{resource.name}</span>
              <ChevronRight className="w-3 h-3 text-ink-500" />
              <span className="text-ink-400 text-xs">VMID {resource.vmid} · {resource.type === 'qemu' ? 'QEMU' : 'LXC'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setLines([])} className="btn btn-ghost p-1.5" title="Clear"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="btn btn-ghost p-1.5"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 font-mono text-xs space-y-1 bg-[#0a0e16]">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-3 animate-fade-in">
              <span className="text-ink-600 shrink-0 select-none">{l.time}</span>
              <span className={l.kind === 'action' ? 'text-brand-300' : l.kind === 'error' ? 'text-danger-400' : 'text-ink-200'}>{l.text}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] bg-ink-900/60">
          <span className="font-mono text-xs text-success-400 shrink-0">root@{resource.name}:~#</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="type a command…"
            className="flex-1 bg-transparent font-mono text-xs text-ink-100 outline-none placeholder:text-ink-500"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}
