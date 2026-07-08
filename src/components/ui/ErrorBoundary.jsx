import { Component } from "react";

// Class component because error boundaries still require one. If any screen
// throws, we show a warm recovery card instead of a white screen — and since
// game state persists to localStorage, "back to start" offers a resume.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Screen crashed:", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="screen-center bg-deep" style={{ textAlign: "center" }}>
        <div className="card" style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }} aria-hidden="true">🫠</div>
          <h2 className="font-display" style={{ fontSize: 24, marginBottom: 10 }}>
            Something boiled over
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
            The app hit a snag — your night is safe. Head back and pick up
            where you left off.
          </p>
          <button className="btn-primary" onClick={this.handleReset}>
            Back to start →
          </button>
        </div>
      </div>
    );
  }
}
