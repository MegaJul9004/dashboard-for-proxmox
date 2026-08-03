export type VMStatus = 'running' | 'stopped' | 'paused' | 'unknown';
export type ResourceType = 'qemu' | 'lxc' | 'storage' | 'node';

export interface ProxmoxNode {
  node: string;
  status: 'online' | 'offline';
  cpu: number; // 0..1
  memory: number; // bytes used
  maxmem: number; // bytes total
  disk: number; // bytes used
  maxdisk: number; // bytes total
  uptime: number; // seconds
  loadavg?: [number, number, number];
}

export interface GuestDiskInfo {
  key: string;
  storage: string;
  size: number; // bytes allocated
  format?: string;
}

export interface ProxmoxResource {
  id: string; // qemu/100 or lxc/101
  type: ResourceType;
  node: string;
  name: string;
  status: VMStatus;
  vmid: number;
  cpu: number; // 0..1 fraction of allocated
  cpus: number; // allocated cores
  maxcpu: number;
  memory: number; // bytes used
  maxmem: number; // bytes total
  disk: number; // bytes used (live) or 0 when stopped
  maxdisk: number; // bytes total allocated
  uptime: number; // seconds
  netin: number; // bytes
  netout: number; // bytes
  diskread: number; // bytes
  diskwrite: number; // bytes
  tags?: string;
  pid?: number;
  disks?: GuestDiskInfo[]; // from config endpoint, available even when stopped
  allocatedDisk?: number; // total allocated disk from config
}

export interface ProxmoxStorage {
  id: string; // storage/local
  storage: string;
  node: string;
  type: string; // lvm, zfs, dir
  content: string;
  used: number;
  total: number;
  active: number;
}

export interface ProxmoxTask {
  upid: string;
  type: string;
  status: string;
  user: string;
  node: string;
  starttime: number; // unix seconds
  endtime?: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ProxmoxState {
  status: ConnectionStatus;
  error: string | null;
  nodes: ProxmoxNode[];
  resources: ProxmoxResource[];
  storage: ProxmoxStorage[];
  tasks: ProxmoxTask[];
  version: string | null;
  lastUpdated: number | null;
}

export const emptyState: ProxmoxState = {
  status: 'disconnected',
  error: null,
  nodes: [],
  resources: [],
  storage: [],
  tasks: [],
  version: null,
  lastUpdated: null,
};
