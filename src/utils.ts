import type { ProxmoxResource } from './types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatUptime(seconds: number): string {
  if (!seconds) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatRelativeTime(unixSeconds: number): string {
  const diff = Date.now() / 1000 - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function pct(used: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.max(0, (used / total) * 100));
}

export function statusColor(status: ProxmoxResource['status']): string {
  switch (status) {
    case 'running':
      return 'text-success-400';
    case 'stopped':
      return 'text-ink-400';
    case 'paused':
      return 'text-warn-500';
    default:
      return 'text-ink-400';
  }
}

export function statusBg(status: ProxmoxResource['status']): string {
  switch (status) {
    case 'running':
      return 'bg-success-500/15 text-success-400 border border-success-500/25';
    case 'stopped':
      return 'bg-ink-700/40 text-ink-300 border border-white/10';
    case 'paused':
      return 'bg-warn-500/15 text-warn-500 border border-warn-500/25';
    default:
      return 'bg-ink-700/40 text-ink-400 border border-white/10';
  }
}

export function statusDot(status: ProxmoxResource['status']): string {
  switch (status) {
    case 'running':
      return 'bg-success-500';
    case 'stopped':
      return 'bg-ink-500';
    case 'paused':
      return 'bg-warn-500';
    default:
      return 'bg-ink-500';
  }
}
