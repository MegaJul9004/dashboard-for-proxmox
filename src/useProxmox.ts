import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProxmoxState } from './types';
import { emptyState } from './types';
import {
  fetchAll,
  performAction,
  fetchGuestConfig,
  createVM,
  createLXC,
  fetchNextVMID,
  type VMAction,
  type CreateVMParams,
  type CreateLXCParams,
} from './proxmox';

const PROXMOX_URL = import.meta.env.VITE_PROXMOX_URL as string | undefined;

export function useProxmox() {
  const [state, setState] = useState<ProxmoxState>(emptyState);
  const [polling, setPolling] = useState(true);
  const [pollInterval, setPollInterval] = useState(5000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!PROXMOX_URL) {
      setState({
        ...emptyState,
        status: 'error',
        error: 'VITE_PROXMOX_URL is not set. Add it to your .env file to connect to your Proxmox VE server.',
        lastUpdated: Date.now(),
      });
      return;
    }
    inFlightRef.current = true;
    try {
      setState((s) => ({ ...s, status: s.status === 'connected' ? 'connected' : 'connecting' }));
      const data = await fetchAll();

      // For stopped LXC containers, fetch their config to get allocated disk info
      const stoppedLxcs = data.resources.filter((r) => r.type === 'lxc' && r.status === 'stopped');
      if (stoppedLxcs.length > 0 && stoppedLxcs.length <= 20) {
        const configs = await Promise.all(
          stoppedLxcs.map((r) =>
            fetchGuestConfig(r.node, 'lxc', r.vmid)
              .then((cfg) => ({ vmid: r.vmid, disks: cfg.disks, allocatedDisk: cfg.rootDisk }))
              .catch(() => ({ vmid: r.vmid, disks: [], allocatedDisk: 0 })),
          ),
        );
        const configMap = new Map(configs.map((c) => [c.vmid, c]));
        data.resources = data.resources.map((r) => {
          const cfg = configMap.get(r.vmid);
          if (cfg && r.type === 'lxc' && r.status === 'stopped') {
            return {
              ...r,
              disks: cfg.disks,
              allocatedDisk: cfg.allocatedDisk,
              maxdisk: cfg.allocatedDisk || r.maxdisk,
            };
          }
          return r;
        });
      }

      // Also fetch disk configs for stopped VMs
      const stoppedVms = data.resources.filter((r) => r.type === 'qemu' && r.status === 'stopped');
      if (stoppedVms.length > 0 && stoppedVms.length <= 20) {
        const configs = await Promise.all(
          stoppedVms.map((r) =>
            fetchGuestConfig(r.node, 'qemu', r.vmid)
              .then((cfg) => ({ vmid: r.vmid, disks: cfg.disks, allocatedDisk: cfg.rootDisk }))
              .catch(() => ({ vmid: r.vmid, disks: [], allocatedDisk: 0 })),
          ),
        );
        const configMap = new Map(configs.map((c) => [c.vmid, c]));
        data.resources = data.resources.map((r) => {
          const cfg = configMap.get(r.vmid);
          if (cfg && r.type === 'qemu' && r.status === 'stopped') {
            return {
              ...r,
              disks: cfg.disks,
              allocatedDisk: cfg.allocatedDisk,
              maxdisk: cfg.allocatedDisk || r.maxdisk,
            };
          }
          return r;
        });
      }

      setState({
        status: 'connected',
        error: null,
        nodes: data.nodes,
        resources: data.resources,
        storage: data.storage,
        tasks: data.tasks,
        version: data.version,
        lastUpdated: Date.now(),
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
        lastUpdated: Date.now(),
      }));
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // polling
  useEffect(() => {
    if (!polling || !PROXMOX_URL) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    const tick = () => {
      refresh().finally(() => {
        timerRef.current = setTimeout(tick, pollInterval);
      });
    };
    timerRef.current = setTimeout(tick, pollInterval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [polling, pollInterval, refresh]);

  const act = useCallback(
    async (vmid: number, action: VMAction) => {
      const res = state.resources.find((r) => r.vmid === vmid);
      if (!res) return;
      const optimistic: Record<VMAction, ProxmoxState['resources'][number]['status']> = {
        start: 'running',
        stop: 'stopped',
        shutdown: 'stopped',
        reboot: 'running',
        reset: 'running',
        suspend: 'paused',
        resume: 'running',
      };
      setState((s) => ({
        ...s,
        resources: s.resources.map((r) =>
          r.vmid === vmid ? { ...r, status: optimistic[action] } : r,
        ),
      }));
      try {
        await performAction(res, action);
      } catch (e) {
        setState((s) => ({
          ...s,
          error: `Action ${action} failed: ${e instanceof Error ? e.message : String(e)}`,
        }));
        refresh();
      }
    },
    [state.resources, refresh],
  );

  const createGuest = useCallback(
    async (type: 'qemu' | 'lxc', params: CreateVMParams | CreateLXCParams) => {
      try {
        if (type === 'qemu') {
          await createVM(params as CreateVMParams);
        } else {
          await createLXC(params as CreateLXCParams);
        }
        // refresh after a short delay to pick up the new guest
        setTimeout(() => refresh(), 1000);
      } catch (e) {
        setState((s) => ({
          ...s,
          error: `Create ${type} failed: ${e instanceof Error ? e.message : String(e)}`,
        }));
        throw e;
      }
    },
    [refresh],
  );

  const getNextVMID = useCallback(async () => {
    return fetchNextVMID();
  }, []);

  return {
    state,
    polling,
    setPolling,
    pollInterval,
    setPollInterval,
    refresh,
    act,
    createGuest,
    getNextVMID,
    proxmoxUrl: PROXMOX_URL,
  };
}
