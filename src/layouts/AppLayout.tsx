import { NavLink, Outlet } from "react-router-dom";
import { Calendar, Users, Clock, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { to: "/schedule", label: "Horarios", icon: Calendar },
  { to: "/team", label: "Equipo", icon: Users },
  { to: "/shift-types", label: "Turnos", icon: Clock },
  { to: "/config", label: "Configuracion", icon: Settings },
];

export default function AppLayout() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-screen gradient-bg">
      <aside className="w-60 glass-card shadow-soft flex flex-col rounded-r-[--radius-card] m-0">
        <div className="p-5 border-b border-pastel-pink/30">
          <h1 className="text-xl font-bold tracking-tight text-warm-dark">Horarios</h1>
          <p className="text-xs font-medium text-pastel-pink-medium mt-0.5">Automaticos</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-pastel-pink/30 text-warm-dark font-semibold"
                    : "text-warm-secondary hover:bg-pastel-pink-light/60 hover:text-warm-dark"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full gradient-pink" />
                  )}
                  <item.icon size={18} strokeWidth={1.5} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-pastel-pink/30">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-warm-secondary hover:bg-pastel-pink-light/60 hover:text-warm-dark transition-all duration-200"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Cerrar sesion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
