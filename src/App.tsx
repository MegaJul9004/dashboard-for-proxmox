import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, ServerOff, Plus } from 'lucide-react';
import { useProxmox } from './useProxmox';
import { Sidebar, type View } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Overview } from './components/Overview';
import { ResourceList } from './components/ResourceList';
import { ResourceCard } from './components/ResourceCard';
import { StorageView } from './components/StorageView';
import { TasksView } from './components/TasksView';
import { ConnectionModal } from './components/ConnectionModal';
import { ConsoleModal } from './components/ConsoleModal';
import { ResourceDrawer } from './components/ResourceDrawer';
import { CreateResourceModal, type CreateFormData } from './components/CreateResourceModal';
import type { ProxmoxResource } from './types';
import type { VMAction, CreateVMParams, CreateLXCParams } from './proxmox';

const PROXMOX_TOKEN = import.meta.env.VITE_PROXMOX_TOKEN as string | undefined;

export default function App() {
  const { state, polling, setPolling, pollInterval, setPollInterval, refresh, act, createGuest, getNextVMID, proxmoxUrl } = useProxmox();
  const [view, setView] = useState<View>('overview');
  const [search, setSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleResource, setConsoleResource] = useState<ProxmoxResource | null>(null);
  const [selected, setSelected] = useState<ProxmoxResource | null>(null);
  const [cardMode, setCardMode] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<'qemu' | 'lxc'>('qemu');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.resources;
    return state.resources.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        String(r.vmid).includes(q) ||
        r.node.toLowerCase().includes(q) ||
        (r.tags ?? '').toLowerCase().includes(q),
    );
  }, [state.resources, search]);

  const vms = filtered.filter((r) => r.type === 'qemu');
  const lxcs = filtered.filter((r) => r.type === 'lxc');

  const handleAction = (vmid: number, action: VMAction) => {
    act(vmid, action);
  };

  const openConsole = (r?: ProxmoxResource) => {
    setConsoleResource(r ?? filtered.find((x) => x.status === 'running') ?? state.resources[0] ?? null);
    setConsoleOpen(true);
  };

  const onSelect = (r: ProxmoxResource) => setSelected(r);

  const handleCreate = async (data: CreateFormData) => {
    if (data.type === 'qemu') {
      const params: CreateVMParams = {
        node: data.node,
        vmid: data.vmid,
        name: data.name,
        cores: data.cores,
        memory: data.memory,
        disk: data.disk,
        storage: data.storage,
      };
      await createGuest('qemu', params);
    } else {
      const params: CreateLXCParams = {
        node: data.node,
        vmid: data.vmid,
        name: data.name,
        cores: data.cores,
        memory: data.memory,
        rootfs: data.disk,
        storage: data.storage,
        ostemplate: data.ostemplate,
      };
      await createGuest('lxc', params);
    }
  };

  return (
    <div className="h-screen flex bg-ink-950 text-ink-100 overflow-hidden">
      <Sidebar
        view={view}
        onView={setView}
        onSettings={() => setSettingsOpen(true)}
        onConsole={() => openConsole()}
        connected={state.status === 'connected'}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          state={state}
          view={view}
          onView={setView}
          onRefresh={refresh}
          onSettings={() => setSettingsOpen(true)}
          polling={polling}
          setPolling={setPolling}
          pollInterval={pollInterval}
          setPollInterval={setPollInterval}
          search={search}
          setSearch={setSearch}
          onMenu={() => setSettingsOpen(true)}
        />

        <main className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-6 py-5 grid-bg">
          {state.status === 'connecting' && state.resources.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-ink-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-400" />
              <p className="text-sm">Connecting to Proxmox VE…</p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="mb-4 panel p-4 border-danger-500/30 bg-danger-500/5 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-danger-400">Connection error</div>
                <div className="text-xs text-ink-300 mt-1">{state.error}</div>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => setSettingsOpen(true)} className="btn btn-primary text-xs">Connection info</button>
                  <button onClick={refresh} className="btn btn-ghost text-xs">Retry</button>
                </div>
              </div>
            </div>
          )}

          {state.status !== 'connecting' && (
            <>
              {view === 'overview' && (
                <Overview
                  nodes={state.nodes}
                  resources={state.resources}
                  storage={state.storage}
                  tasks={state.tasks}
                  onView={setView}
                  onSelect={onSelect}
                />
              )}

              {view === 'vms' && (
                <ResourceSection
                  title="Virtual Machines"
                  subtitle={`${vms.length} QEMU guest${vms.length !== 1 ? 's' : ''}`}
                  resources={vms}
                  cardMode={cardMode}
                  setCardMode={setCardMode}
                  onAction={handleAction}
                  onSelect={onSelect}
                  onCreate={() => { setCreateType('qemu'); setCreateOpen(true); }}
                />
              )}

              {view === 'lxc' && (
                <ResourceSection
                  title="LXC Containers"
                  subtitle={`${lxcs.length} system container${lxcs.length !== 1 ? 's' : ''}`}
                  resources={lxcs}
                  cardMode={cardMode}
                  setCardMode={setCardMode}
                  onAction={handleAction}
                  onSelect={onSelect}
                  onCreate={() => { setCreateType('lxc'); setCreateOpen(true); }}
                />
              )}

              {view === 'storage' && <StorageView storage={state.storage} resources={state.resources} />}
              {view === 'tasks' && <TasksView tasks={state.tasks} />}
            </>
          )}
        </main>
      </div>

      <ConnectionModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        proxmoxUrl={proxmoxUrl}
        hasToken={Boolean(PROXMOX_TOKEN)}
        status={state.status}
        error={state.error}
      />

      <ConsoleModal
        open={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        resource={consoleResource}
      />

      <ResourceDrawer
        resource={selected}
        onClose={() => setSelected(null)}
        onAction={handleAction}
        onConsole={() => {
          if (selected) openConsole(selected);
        }}
      />

      <CreateResourceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        nodes={state.nodes}
        storage={state.storage}
        getNextVMID={getNextVMID}
        defaultType={createType}
      />
    </div>
  );
}

function ResourceSection({
  title,
  subtitle,
  resources,
  cardMode,
  setCardMode,
  onAction,
  onSelect,
  onCreate,
}: {
  title: string;
  subtitle: string;
  resources: ProxmoxResource[];
  cardMode: boolean;
  setCardMode: (b: boolean) => void;
  onAction: (vmid: number, action: VMAction) => void;
  onSelect: (r: ProxmoxResource) => void;
  onCreate: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-100">{title}</h2>
          <p className="text-xs text-ink-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCreate} className="btn btn-primary text-xs">
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-ink-800/60 border border-white/[0.06]">
            <button
              onClick={() => setCardMode(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!cardMode ? 'bg-brand-500/20 text-brand-300' : 'text-ink-400 hover:text-ink-200'}`}
            >
              List
            </button>
            <button
              onClick={() => setCardMode(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${cardMode ? 'bg-brand-500/20 text-brand-300' : 'text-ink-400 hover:text-ink-200'}`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {!resources.length ? (
        <div className="panel p-12 flex flex-col items-center text-ink-400">
          <ServerOff className="w-8 h-8 mb-3 text-ink-500" />
          <p className="text-sm">No resources match your search.</p>
        </div>
      ) : cardMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} onAction={onAction} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <ResourceList resources={resources} onAction={onAction} onSelect={onSelect} />
      )}
    </div>
  );
}
