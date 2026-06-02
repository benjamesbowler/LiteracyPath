import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV || this.props.logErrors) {
      console.error(this.props.logLabel || "Error boundary caught render error.", { error, info });
    }
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
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

    return (
      <div className={this.props.className || "card page-card page-stack error-boundary-fallback"}>
        <h2>Something went wrong.</h2>
        <p>Please refresh or go back.</p>
      </div>
    );
  }
}
