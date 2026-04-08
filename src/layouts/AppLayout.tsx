import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { to: "/schedule", label: "Horarios", icon: "📅" },
  { to: "/team", label: "Equipo", icon: "👥" },
  { to: "/shift-types", label: "Turnos", icon: "⏰" },
  { to: "/config", label: "Configuracion", icon: "⚙️" },
];

export default function AppLayout() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-screen bg-pink-50/40">
      <aside className="w-56 bg-white border-r border-pink-100 flex flex-col">
        <div className="p-4 border-b border-pink-100">
          <h1 className="text-lg font-semibold text-pink-900">Horarios</h1>
          <p className="text-xs text-pink-400">Automaticos</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-pink-50 text-pink-700 font-medium"
                    : "text-gray-600 hover:bg-pink-50/50"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-pink-100">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-pink-50/50 rounded-md"
          >
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
