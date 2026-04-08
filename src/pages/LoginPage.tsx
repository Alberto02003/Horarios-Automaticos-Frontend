import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center gradient-bg relative overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-pastel-pink/40 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-pastel-lavender/40 rounded-full blur-3xl" />

      <form onSubmit={handleSubmit} className="relative glass-card rounded-3xl p-10 w-full max-w-md shadow-elevated animate-scale-in">
        <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-pastel-pink-deep to-pastel-lavender bg-clip-text text-transparent">
          Horarios
        </h1>
        <p className="text-sm text-warm-secondary mb-8">Automaticos</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50/80 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm mb-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-pastel"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-secondary mb-1.5">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-pastel"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
