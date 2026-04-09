import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Settings, Check, X, Users, Clock, Sliders, Plus, Pencil, UserX } from "lucide-react";
import { useGlobalPreferences, useUpdateGlobalPreferences } from "@/api/preferences";
import { useShiftTypes, useCreateShiftType, useUpdateShiftType, useDeleteShiftType } from "@/api/shiftTypes";
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from "@/api/members";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import MemberForm from "@/components/MemberForm";
import ShiftTypeForm from "@/components/ShiftTypeForm";
import { useToast } from "@/components/ui/ToastProvider";
import type { ShiftCoverage } from "@/types/preferences";
import type { Member, MemberCreate } from "@/types/member";
import type { ShiftType, ShiftTypeCreate } from "@/types/shift";

type ConfigTab = "generation" | "members" | "shifts";

const TABS: { id: ConfigTab; label: string; icon: typeof Sliders }[] = [
  { id: "generation", label: "Generacion", icon: Sliders },
  { id: "members", label: "Equipo", icon: Users },
  { id: "shifts", label: "Turnos", icon: Clock },
];

export default function ConfigMenu() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ConfigTab>("generation");
  const contentRef = useRef<HTMLDivElement>(null);

  // Swipe support
  const touchStart = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStart.current;
    const tabIdx = TABS.findIndex((t) => t.id === tab);
    if (diff < -50 && tabIdx < TABS.length - 1) setTab(TABS[tabIdx + 1].id);
    if (diff > 50 && tabIdx > 0) setTab(TABS[tabIdx - 1].id);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-9 h-9 rounded-full bg-p-lavender-light flex items-center justify-center hover:bg-p-lavender transition-colors focus:outline-none">
        <Settings size={16} className="text-text-secondary" />
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-text-primary/20 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-surface-card rounded-2xl w-full max-w-xl max-h-[85vh] shadow-lg border border-[#F0EDF3] animate-scale-in focus:outline-none flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#F0EDF3] shrink-0">
              <Dialog.Title className="text-lg font-bold text-text-primary tracking-tight">Configuracion</Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-text-tertiary hover:bg-p-lavender-light transition-colors"><X size={16} /></Dialog.Close>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#F0EDF3] px-5 shrink-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                    tab === t.id ? "border-text-primary text-text-primary" : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>

            {/* Content — swipeable */}
            <div ref={contentRef} className="flex-1 overflow-auto p-5" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              {tab === "generation" && <GenerationTab />}
              {tab === "members" && <MembersTab />}
              {tab === "shifts" && <ShiftsTab />}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

// ─── GENERATION TAB ───
function GenerationTab() {
  const { data: prefs } = useGlobalPreferences();
  const { data: shiftTypes } = useShiftTypes();
  const updatePrefs = useUpdateGlobalPreferences();

  const [weeklyLimit, setWeeklyLimit] = useState("40");
  const [minRest, setMinRest] = useState("12");
  const [maxConsecutive, setMaxConsecutive] = useState("6");
  const [weekendWork, setWeekendWork] = useState(true);
  const [balanced, setBalanced] = useState(true);
  const [fillUnassigned, setFillUnassigned] = useState(true);
  const [coverage, setCoverage] = useState<Record<string, ShiftCoverage>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefs) {
      setWeeklyLimit(String(prefs.general_weekly_hour_limit));
      const p = prefs.preferences_jsonb;
      if (p.min_rest_hours != null) setMinRest(String(p.min_rest_hours));
      if (p.max_consecutive_days != null) setMaxConsecutive(String(p.max_consecutive_days));
      if (p.allow_weekend_work != null) setWeekendWork(p.allow_weekend_work);
      if (p.prefer_balanced_distribution != null) setBalanced(p.prefer_balanced_distribution);
      if (p.fill_unassigned_only != null) setFillUnassigned(p.fill_unassigned_only);
      if (p.shift_coverage) setCoverage(p.shift_coverage);
    }
  }, [prefs]);

  useEffect(() => {
    if (shiftTypes) {
      setCoverage((prev) => {
        const next = { ...prev };
        shiftTypes.filter((s) => s.is_active && s.counts_as_work_time).forEach((s) => {
          if (!next[String(s.id)]) next[String(s.id)] = { min: 0, max: 10 };
        });
        return next;
      });
    }
  }, [shiftTypes]);

  const updateCov = (id: string, field: "min" | "max", val: number) => {
    setCoverage((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  };

  const handleSave = () => {
    updatePrefs.mutate({
      general_weekly_hour_limit: parseFloat(weeklyLimit),
      preferences_jsonb: { min_rest_hours: parseInt(minRest), max_consecutive_days: parseInt(maxConsecutive), allow_weekend_work: weekendWork, prefer_balanced_distribution: balanced, fill_unassigned_only: fillUnassigned, shift_coverage: coverage },
    }, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } });
  };

  const workShifts = (shiftTypes || []).filter((s) => s.is_active && s.counts_as_work_time);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-3">General</h3>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-[10px] text-text-tertiary mb-1">Horas/sem</label><input type="number" value={weeklyLimit} onChange={(e) => setWeeklyLimit(e.target.value)} className="input-pastel text-xs py-1.5" /></div>
          <div><label className="block text-[10px] text-text-tertiary mb-1">Descanso (h)</label><input type="number" value={minRest} onChange={(e) => setMinRest(e.target.value)} className="input-pastel text-xs py-1.5" /></div>
          <div><label className="block text-[10px] text-text-tertiary mb-1">Max dias</label><input type="number" value={maxConsecutive} onChange={(e) => setMaxConsecutive(e.target.value)} className="input-pastel text-xs py-1.5" /></div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-2">Reglas</h3>
        <div className="space-y-0.5">
          {[
            { checked: weekendWork, set: setWeekendWork, label: "Fines de semana" },
            { checked: balanced, set: setBalanced, label: "Distribucion equilibrada" },
            { checked: fillUnassigned, set: setFillUnassigned, label: "Solo rellenar huecos" },
          ].map((item, i) => (
            <label key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-p-lavender-light/50 transition-colors cursor-pointer">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${item.checked ? "bg-text-primary border-text-primary" : "border-[#D8D5DD] bg-white"}`}>
                {item.checked && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)} className="sr-only" />
              <span className="text-xs text-text-primary">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {workShifts.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-2">Cobertura por turno</h3>
          <div className="space-y-2">
            {workShifts.map((st) => {
              const cov = coverage[String(st.id)] || { min: 0, max: 10 };
              return (
                <div key={st.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-[#F0EDF3]">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ backgroundColor: st.color }}>{st.code}</div>
                  <span className="text-xs text-text-primary flex-1 truncate">{st.name}</span>
                  <div className="flex gap-1">
                    <div className="text-center"><label className="block text-[8px] text-text-tertiary">Min</label><input type="number" value={cov.min} onChange={(e) => updateCov(String(st.id), "min", parseInt(e.target.value) || 0)} className="input-pastel text-xs py-1 px-1.5 w-12 text-center" /></div>
                    <div className="text-center"><label className="block text-[8px] text-text-tertiary">Max</label><input type="number" value={cov.max} onChange={(e) => updateCov(String(st.id), "max", parseInt(e.target.value) || 0)} className="input-pastel text-xs py-1 px-1.5 w-12 text-center" /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={updatePrefs.isPending} className="btn-primary w-full text-xs py-2 rounded-xl">
        {saved ? "Guardado ✓" : updatePrefs.isPending ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}

// ─── MEMBERS TAB ───
function MembersTab() {
  const { data: members, isLoading } = useMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);

  const handleCreate = (data: MemberCreate) => { createMember.mutate(data, { onSuccess: () => setShowForm(false) }); };
  const handleUpdate = (data: MemberCreate) => { if (!editing) return; updateMember.mutate({ id: editing.id, data }, { onSuccess: () => { setEditing(null); setShowForm(false); } }); };
  const handleDelete = () => { if (!confirmDelete) return; deleteMember.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) }); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-tertiary">{members?.length || 0} integrantes</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary text-xs px-3 py-1.5 rounded-xl"><Plus size={12} /> Agregar</button>
      </div>

      <Modal open={showForm} onOpenChange={setShowForm} title={editing ? "Editar miembro" : "Nuevo miembro"}>
        <MemberForm member={editing} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => setShowForm(false)} loading={createMember.isPending || updateMember.isPending} />
      </Modal>
      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }} title="Desactivar miembro" description={`Se desactivara a ${confirmDelete?.full_name}.`} onConfirm={handleDelete} confirmLabel="Desactivar" variant="warning" />

      {isLoading ? <p className="text-xs text-text-tertiary">Cargando...</p> : (
        <div className="space-y-1.5">
          {members?.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#F0EDF3] group hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: m.color_tag }}>{m.full_name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{m.full_name}</p>
                <p className="text-[10px] text-text-tertiary">{m.role_name} · {m.weekly_hour_limit}h</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${m.is_active ? "bg-p-mint" : "bg-[#E0DDE3]"}`} />
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip content="Editar"><button onClick={() => { setEditing(m); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-p-lavender-light"><Pencil size={12} className="text-text-secondary" /></button></Tooltip>
                {m.is_active && <Tooltip content="Desactivar"><button onClick={() => setConfirmDelete(m)} className="p-1.5 rounded-lg hover:bg-p-pink-light"><UserX size={12} className="text-text-secondary" /></button></Tooltip>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SHIFTS TAB ───
function ShiftsTab() {
  const { data: shiftTypes, isLoading } = useShiftTypes();
  const createST = useCreateShiftType();
  const updateST = useUpdateShiftType();
  const deleteST = useDeleteShiftType();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ShiftType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ShiftType | null>(null);

  const handleCreate = (data: ShiftTypeCreate) => { createST.mutate(data, { onSuccess: () => setShowForm(false) }); };
  const handleUpdate = (data: ShiftTypeCreate) => { if (!editing) return; updateST.mutate({ id: editing.id, data }, { onSuccess: () => { setEditing(null); setShowForm(false); } }); };
  const handleDelete = () => { if (!confirmDelete) return; deleteST.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) }); };

  const CATEGORY_LABELS: Record<string, string> = { work: "Trabajo", vacation: "Vacaciones", special: "Especial" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-tertiary">{shiftTypes?.length || 0} tipos</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary text-xs px-3 py-1.5 rounded-xl"><Plus size={12} /> Agregar</button>
      </div>

      <Modal open={showForm} onOpenChange={setShowForm} title={editing ? "Editar turno" : "Nuevo turno"}>
        <ShiftTypeForm shiftType={editing} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => setShowForm(false)} loading={createST.isPending || updateST.isPending} />
      </Modal>
      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }} title="Desactivar turno" description={`Se desactivara "${confirmDelete?.name}".`} onConfirm={handleDelete} confirmLabel="Desactivar" variant="warning" />

      {isLoading ? <p className="text-xs text-text-tertiary">Cargando...</p> : (
        <div className="grid grid-cols-2 gap-2">
          {shiftTypes?.map((st) => (
            <div key={st.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#F0EDF3] group hover:shadow-xs transition-all">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: st.color }}>{st.code}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{st.name}</p>
                <p className="text-[10px] text-text-tertiary">{CATEGORY_LABELS[st.category]}{st.default_start_time ? ` · ${st.default_start_time}-${st.default_end_time}` : ""}</p>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip content="Editar"><button onClick={() => { setEditing(st); setShowForm(true); }} className="p-1 rounded-lg hover:bg-p-lavender-light"><Pencil size={11} className="text-text-secondary" /></button></Tooltip>
                {st.is_active && <Tooltip content="Desactivar"><button onClick={() => setConfirmDelete(st)} className="p-1 rounded-lg hover:bg-p-pink-light"><X size={11} className="text-text-secondary" /></button></Tooltip>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
