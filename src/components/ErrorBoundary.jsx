import { Component } from "react";
import { logBoundaryError } from "../utils/errorLog.js";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }

    return null;
  }

  componentDidCatch(error, info) {
    logBoundaryError(this.props.logLabel, error);
    if (import.meta.env.DEV || this.props.logErrors) {
      console.error(this.props.logLabel || "Error boundary caught render error.", { error, info });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    if (typeof this.props.fallback === "function") {
      return this.props.fallback({
        error: this.state.error,
        reset: () => this.setState({ error: null })
      });
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    // The default fallback is written for a child mid-game, not a developer:
    // no jargon, a way to try again in place, and a fresh start that cannot
    // dead-end. The error itself is already in the crash log for grown-ups.
    return (
      <div className={this.props.className || "card page-card page-stack error-boundary-fallback"}>
        <span className="error-boundary-face" aria-hidden="true">:(</span>
        <h2>Oops — this page tripped over!</h2>
        <p>It happens to everyone. Let&rsquo;s stand it back up.</p>
        <div className="error-boundary-actions">
          <button className="main-button" type="button" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
          <button className="report-button" type="button" onClick={() => window.location.reload()}>
            Start fresh
          </button>
        </div>
      </div>
    );
  }
}
