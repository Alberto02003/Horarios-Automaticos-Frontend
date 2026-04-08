import { NavLink, Outlet } from "react-router-dom";
import { Calendar, Users, Clock, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { to: "/schedule", label: "Horarios", icon: Calendar },
  { to: "/team", label: "Equipo", icon: Users },
  { to: "/shift-types", label: "Turnos", icon: Clock },
  { to: "/config", label: "Ajustes", icon: Settings },
];

export default function AppLayout() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-screen bg-surface">
      {/* Revolut-style dark sidebar */}
      <aside className="w-[220px] bg-sidebar-bg flex flex-col shrink-0">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-p-pink flex items-center justify-center">
              <Calendar size={16} className="text-text-primary" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white tracking-tight leading-none">Horarios</h1>
              <p className="text-[10px] font-medium text-sidebar-text mt-0.5 tracking-wide uppercase">Automaticos</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150 ${
                  isActive
                    ? "bg-sidebar-active text-sidebar-text-active font-semibold"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
                }`
              }
            >
              <item.icon size={18} strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-all duration-150"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
