import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-wrap">
          <div className="card" role="alert">
            <span className="eyebrow">Fallo del sistema</span>
            <h1>Algo se ha roto</h1>
            <p className="muted">
              La interfaz ha fallado al renderizar. Recarga la página para volver al catálogo.
            </p>
            <button className="btn primary" onClick={this.handleReload}>
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
