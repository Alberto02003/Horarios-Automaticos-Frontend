import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Calendar } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/api/client";
import CatPaws from "@/components/CatPaws";

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
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface relative flex items-center justify-center">
      <CatPaws />

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-p-pink flex items-center justify-center">
            <Calendar size={22} className="text-text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight leading-none">Horarios</h1>
            <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Automaticos</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] shadow-lg p-5 sm:p-8">
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight text-center">Bienvenida</h2>
          <p className="text-sm text-text-secondary text-center mt-1 mb-6">Inicia sesion para continuar</p>

          {error && (
            <div className="flex items-center gap-2 bg-p-pink-light border border-p-pink text-p-pink-deep px-4 py-2.5 rounded-xl text-sm mb-5 animate-scale-in">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-text-tertiary mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-pastel" placeholder="tu@email.com" required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-tertiary mb-1.5 uppercase tracking-wide">Contrasena</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-pastel" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 rounded-xl">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        {/* Footer palette */}
        <div className="flex gap-2 justify-center mt-8">
          {["#FFD1DC", "#A2CFFE", "#AAF0D1", "#E3E4FA", "#DCD0FF", "#FFDAB9", "#B0E0E6", "#FFFACD"].map((c) => (
            <div key={c} className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}
