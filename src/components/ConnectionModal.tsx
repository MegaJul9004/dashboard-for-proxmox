import { X, Server, KeyRound, Globe, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export function ConnectionModal({
  open,
  onClose,
  proxmoxUrl,
  hasToken,
  status,
  error,
}: {
  open: boolean;
  onClose: () => void;
  proxmoxUrl: string | undefined;
  hasToken: boolean;
  status: string;
  error: string | null;
}) {
  if (!open) return null;

  const connected = status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg panel p-6 animate-scale-in shadow-pop">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-100">Proxmox VE Connection</h2>
              <p className="text-xs text-ink-400">Configured via environment variables</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost -mr-2"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-ink-900/40">
            {connected ? (
              <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0" />
            ) : status === 'error' ? (
              <AlertCircle className="w-5 h-5 text-danger-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-warn-500 shrink-0" />
            )}
            <div>
              <div className="text-sm font-medium text-ink-100">
                {connected ? 'Connected' : status === 'error' ? 'Connection error' : 'Connecting…'}
              </div>
              <div className="text-xs text-ink-400 mt-0.5">
                {connected
                  ? 'Live data from your Proxmox VE server'
                  : status === 'error'
                    ? error
                    : 'Establishing connection…'}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">
              <Globe className="w-3 h-3" /> Server URL
            </div>
            <div className="input font-mono text-xs flex items-center">
              {proxmoxUrl ? (
                <span className="text-ink-100">{proxmoxUrl}</span>
              ) : (
                <span className="text-ink-500">not configured</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] uppercase tracking-wide text-ink-400">
              <KeyRound className="w-3 h-3" /> API Token
            </div>
            <div className="input font-mono text-xs flex items-center">
              {hasToken ? (
                <span className="text-success-400">configured (hidden)</span>
              ) : (
                <span className="text-ink-500">not configured</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 p-3 rounded-lg bg-brand-500/5 border border-brand-500/15 text-[11px] text-ink-300 leading-relaxed">
          <p className="mb-2">To change the connection, edit the <span className="font-mono text-ink-200">.env</span> file in the project root:</p>
          <pre className="font-mono text-[10px] text-ink-200 bg-ink-900/60 rounded-md p-2 overflow-x-auto scrollbar-thin">{`VITE_PROXMOX_URL=https://192.168.1.100:8006
VITE_PROXMOX_TOKEN=root@pam!tokenname=tokenvalue`}</pre>
          <p className="mt-2">Create an API token in Proxmox under <span className="font-mono text-ink-200">Datacenter → API Tokens</span>. The Vite dev server proxies all <span className="font-mono text-ink-200">/api2</span> requests to your Proxmox server, injecting the token automatically — this avoids CORS issues and self-signed certificate warnings in the browser.</p>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="btn btn-primary">Close</button>
        </div>
      </div>
    </div>
  );
}
