import { CheckCircle2, XCircle, Clock, User, Server } from 'lucide-react';
import type { ProxmoxTask } from '../types';
import { formatRelativeTime } from '../utils';

export function TasksView({ tasks }: { tasks: ProxmoxTask[] }) {
  return (
    <div className="panel overflow-hidden animate-fade-in">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-ink-400 border-b border-white/[0.06]">
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Node</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">User</th>
              <th className="px-4 py-3 font-medium">Started</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">UPID</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const ok = t.status === 'OK';
              return (
                <tr key={t.upid} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3">
                    {ok ? (
                      <span className="chip bg-success-500/15 text-success-400 border border-success-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5" /> OK
                      </span>
                    ) : (
                      <span className="chip bg-danger-500/15 text-danger-400 border border-danger-500/25" title={t.status}>
                        <XCircle className="w-3.5 h-3.5" /> Error
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-200">{t.type}</td>
                  <td className="px-4 py-3 text-ink-300 text-xs">{t.node}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-ink-300 text-xs font-mono">{t.user}</td>
                  <td className="px-4 py-3 text-ink-400 text-xs flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {formatRelativeTime(t.starttime)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-ink-400 text-[11px] font-mono truncate max-w-xs" title={t.upid}>{t.upid}</td>
                </tr>
              );
            })}
            {!tasks.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-400 text-sm">No tasks recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { User, Server };
