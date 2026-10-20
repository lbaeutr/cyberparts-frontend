const DEFAULT_FALLBACK = "Ha ocurrido un error inesperado";

function fieldPath(loc) {
  if (!Array.isArray(loc)) return "";
  return loc.filter((part) => part !== "body" && part !== "query" && part !== "path").join(".");
}

function formatValidationError(entry) {
  if (!entry || typeof entry !== "object") return "";
  const message = typeof entry.msg === "string" ? entry.msg : "";
  const field = fieldPath(entry.loc);
  if (field && message) return `${field}: ${message}`;
  return field || message;
}

export function getErrorMessage(error, fallback = DEFAULT_FALLBACK) {
  const data = error?.response?.data;
  const detail = data?.detail;

  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const messages = detail.map(formatValidationError).filter(Boolean);
    if (messages.length) return messages.join(" · ");
  }

  if (detail && typeof detail === "object") {
    const message = formatValidationError(detail);
    if (message) return message;
  }

  if (!error?.response) return "No hay conexión con el servidor.";

  return fallback;
}
