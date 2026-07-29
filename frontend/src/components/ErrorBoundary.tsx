import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("ErrorBoundary:", error, info); }

  render() {
    if (this.state.error) {
      return (
        <div className="app" style={{ textAlign: "center", paddingTop: 80 }}>
          <div className="error-box">
            <div className="error-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            </div>
            <div className="error-title">Xatolik yuz berdi</div>
            <div className="error-text">{this.state.error.message}</div>
            <button className="btn btn-secondary" onClick={() => this.setState({ error: null })}>
              Qayta urinish
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
