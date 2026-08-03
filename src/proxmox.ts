import type { ProxmoxNode, ProxmoxResource, ProxmoxStorage, ProxmoxTask } from './types';

const API_BASE = '/api2/json';

interface RawApiResponse<T> {
  data: T;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.errors?.[''] || body?.message || msg;
    } catch {
      // non-json error body
    }
    throw new Error(msg);
  }
  const body = (await res.json()) as RawApiResponse<T>;
  return body.data;
}

async function apiPost(path: string, body?: Record<string, string | number | boolean>): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body ? new URLSearchParams(body as Record<string, string>).toString() : undefined,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.errors?.[''] || j?.message || msg;
    } catch {
      // non-json error body
    }
    throw new Error(msg);
  }
}

export async function fetchVersion(): Promise<string> {
  const data = await apiGet<{ version: string; release: string }>('/version');
  return data ? `v${data.version} (${data.release})` : 'unknown';
}

export async function fetchNodes(): Promise<ProxmoxNode[]> {
  const data = await apiGet<any[]>('/nodes');
  return (data || []).map((n: any): ProxmoxNode => ({
    node: n.node,
    status: n.status,
    cpu: n.cpu ?? 0,
    memory: n.mem ?? 0,
    maxmem: n.maxmem ?? 0,
    disk: n.disk ?? 0,
    maxdisk: n.maxdisk ?? 0,
    uptime: n.uptime ?? 0,
  }));
}

export async function fetchResources(): Promise<ProxmoxResource[]> {
  const data = await apiGet<any[]>('/cluster/resources?type=vm');
  return (data || []).map((r: any): ProxmoxResource => ({
    id: r.id,
    type: r.type,
    node: r.node,
    name: r.name ?? r.id,
    status: r.status ?? 'unknown',
    vmid: r.vmid,
    cpu: r.cpu ?? 0,
    cpus: r.cpus ?? r.maxcpu ?? 0,
    maxcpu: r.maxcpu ?? 0,
    memory: r.mem ?? 0,
    maxmem: r.maxmem ?? 0,
    disk: r.disk ?? 0,
    maxdisk: r.maxdisk ?? 0,
    uptime: r.uptime ?? 0,
    netin: r.netin ?? 0,
    netout: r.netout ?? 0,
    diskread: r.diskread ?? 0,
    diskwrite: r.diskwrite ?? 0,
    tags: r.tags,
    pid: r.pid,
  }));
}

export async function fetchStorage(): Promise<ProxmoxStorage[]> {
  const data = await apiGet<any[]>('/cluster/resources?type=storage');
  return (data || []).map((s: any): ProxmoxStorage => ({
    id: s.id,
    storage: s.storage,
    node: s.node,
    type: s.type,
    content: s.content,
    used: s.used ?? 0,
    total: s.maxdisk ?? s.total ?? 0,
    active: s.active ?? 0,
  }));
}

export async function fetchNodeStorageList(node: string): Promise<ProxmoxStorage[]> {
  const data = await apiGet<any[]>(`/nodes/${node}/storage`);
  return (data || []).map((s: any): ProxmoxStorage => ({
    id: s.id,
    storage: s.storage,
    node,
    type: s.type,
    content: s.content,
    used: s.used ?? 0,
    total: s.total ?? 0,
    active: s.active ?? 0,
  }));
}

export async function fetchTasks(limit = 20): Promise<ProxmoxTask[]> {
  const data = await apiGet<any[]>(`/cluster/tasks?limit=${limit}`);
  return (data || []).map((t: any): ProxmoxTask => ({
    upid: t.upid,
    type: t.type ?? t.workertype,
    status: t.status,
    user: t.user,
    node: t.node,
    starttime: t.starttime ?? 0,
    endtime: t.endtime,
  }));
}

export type VMAction = 'start' | 'stop' | 'shutdown' | 'reboot' | 'reset' | 'suspend' | 'resume';

export async function performAction(resource: ProxmoxResource, action: VMAction): Promise<void> {
  await apiPost(`/nodes/${resource.node}/${resource.type}/${resource.vmid}/status/${action}`);
}

export interface GuestDiskInfo {
  key: string;
  storage: string;
  size: number; // bytes
  format?: string;
}

export async function fetchGuestConfig(
  node: string,
  type: string,
  vmid: number,
): Promise<{ disks: GuestDiskInfo[]; rootDisk: number }> {
  const data = await apiGet<any[]>(`/nodes/${node}/${type}/${vmid}/config`);
  const disks: GuestDiskInfo[] = [];
  let rootDisk = 0;
  if (Array.isArray(data)) {
    for (const entry of data) {
      // entries are key-value pairs like { key: 'rootfs', value: 'local-lvm:vm-201-disk-0,discard=on,size=8G' }
      const key = entry.key as string;
      const value = entry.value as string;
      if (/^(rootfs|mp\d+|scsi\d+|virtio\d+|ide\d+|sata\d+|nvme\d+)$/.test(key)) {
        const storageMatch = value.match(/^([^:]+):/);
        const sizeMatch = value.match(/size=(\d+)([KMGT])/i);
        if (sizeMatch) {
          const num = parseInt(sizeMatch[1], 10);
          const unit = sizeMatch[2].toUpperCase();
          const mult = unit === 'T' ? 1024 ** 4 : unit === 'G' ? 1024 ** 3 : unit === 'M' ? 1024 ** 2 : 1024;
          const size = num * mult;
          disks.push({ key, storage: storageMatch?.[1] ?? 'unknown', size });
          if (key === 'rootfs' || key === 'mp0') rootDisk = Math.max(rootDisk, size);
        }
      }
    }
  }
  return { disks, rootDisk };
}

export interface CreateVMParams {
  node: string;
  vmid: number;
  name: string;
  cores: number;
  memory: number; // MB
  disk: number; // GB
  storage: string;
  ostype?: string;
  net0?: string;
}

export async function createVM(params: CreateVMParams): Promise<void> {
  await apiPost(`/nodes/${params.node}/qemu`, {
    vmid: params.vmid,
    name: params.name,
    cores: params.cores,
    memory: params.memory,
    ostype: params.ostype ?? 'l26',
    scsihw: 'virtio-scsi-pci',
    scsi0: `${params.storage}:${params.disk},format=raw`,
    net0: params.net0 ?? 'virtio,bridge=vmbr0',
    onboot: 0,
  });
}

export interface CreateLXCParams {
  node: string;
  vmid: number;
  name: string;
  cores: number;
  memory: number; // MB
  rootfs: number; // GB
  storage: string;
  ostemplate?: string;
  password?: string;
}

export async function createLXC(params: CreateLXCParams): Promise<void> {
  await apiPost(`/nodes/${params.node}/lxc`, {
    vmid: params.vmid,
    name: params.name,
    cores: params.cores,
    memory: params.memory,
    rootfs: `${params.storage}:${params.rootfs}`,
    ostemplate: params.ostemplate ?? '',
    password: params.password ?? '',
    net0: 'name=eth0,bridge=vmbr0,ip=dhcp',
    onboot: 0,
  });
}

export async function fetchNextVMID(): Promise<number> {
  const data = await apiGet<{ id: number }>('/cluster/nextid');
  return data?.id ?? 100;
}

export async function fetchTemplates(node: string, storage: string): Promise<string[]> {
  const data = await apiGet<any[]>(`/nodes/${node}/storage/${storage}/content?content=vztmpl`);
  return (data || []).map((v: any) => v.volid as string);
}

export async function fetchAll(): Promise<{
  nodes: ProxmoxNode[];
  resources: ProxmoxResource[];
  storage: ProxmoxStorage[];
  tasks: ProxmoxTask[];
  version: string;
}> {
  const [version, nodes, resources, storage, tasks] = await Promise.all([
    fetchVersion().catch(() => 'unknown'),
    fetchNodes().catch(() => []),
    fetchResources().catch(() => []),
    fetchStorage().catch(() => []),
    fetchTasks().catch(() => []),
  ]);
  return { version, nodes, resources, storage, tasks };
}
