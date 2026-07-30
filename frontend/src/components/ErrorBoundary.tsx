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
          <div className="error-box page-enter">
            <div className="error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" fill="currentColor" fillOpacity="0.05" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="error-title">Xatolik yuz berdi</div>
            <div className="error-text">{this.state.error.message}</div>
            <button className="btn" onClick={() => window.location.reload()}>
              Qayta urinish
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
