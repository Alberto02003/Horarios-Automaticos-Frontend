import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Calendar } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/api/client";

interface LoginResponse {
  access_token: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<LoginResponse>("/api/auth/login", { email, password });
      login(data.access_token);
      navigate("/schedule");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar-bg items-center justify-center p-12">
        <div className="max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-p-pink flex items-center justify-center mb-8">
            <Calendar size={28} className="text-text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            Gestiona horarios<br />de forma simple
          </h1>
          <p className="text-sidebar-text mt-4 text-lg leading-relaxed">
            Genera, revisa y aprueba los turnos de tu equipo en un solo lugar.
          </p>
          <div className="flex gap-3 mt-8">
            {["#FFD1DC", "#A2CFFE", "#AAF0D1", "#E3E4FA", "#DCD0FF", "#FFDAB9"].map((c) => (
              <div key={c} className="w-8 h-8 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-p-pink flex items-center justify-center">
              <Calendar size={18} className="text-text-primary" />
            </div>
            <span className="text-lg font-bold text-text-primary tracking-tight">Horarios</span>
          </div>

          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Bienvenida</h2>
          <p className="text-text-secondary mt-1 mb-8">Inicia sesion para continuar</p>

          {error && (
            <div className="flex items-center gap-2 bg-p-pink-light border border-p-pink text-p-pink-deep px-4 py-2.5 rounded-lg text-sm mb-5 animate-slide-up">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-pastel" placeholder="tu@email.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Contrasena</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-pastel" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
