import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="auth-wrap center">
      <span className="eyebrow">Error 0x194</span>
      <h1>Señal perdida</h1>
      <p className="muted">La ruta que buscas no existe en esta red.</p>
      <Link className="btn primary" to="/">
        Volver al catálogo
      </Link>
    </div>
  );
}
