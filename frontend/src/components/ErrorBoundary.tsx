import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  componentDidCatch(e: Error, i: ErrorInfo) { console.error(e, i); }
  render() {
    if (this.state.error) return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-lg font-bold mb-2">Xatolik yuz berdi</h2>
        <p className="text-sm text-text-secondary mb-6">{this.state.error.message}</p>
        <button className="btn max-w-[200px]" onClick={() => window.location.reload()}>Qayta urinish</button>
      </div>
    );
    return this.props.children;
  }
}
