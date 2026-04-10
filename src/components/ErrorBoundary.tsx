import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-p-peach-light flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Algo salio mal</h2>
          <p className="text-sm text-text-secondary mb-4 max-w-md">
            {this.state.error?.message || "Ha ocurrido un error inesperado."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="btn-primary text-sm rounded-xl"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
