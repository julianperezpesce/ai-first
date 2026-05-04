export const messages = {
  en: {
    scanning: "Scanning repository",
    found: "Found",
    files: "files",
    done: "Done",
    created: "Created",
    error: "Error",
    generating: "Generating",
    success: "Success",
    reading: "Reading",
  },
  es: {
    scanning: "Escaneando repositorio",
    found: "Encontrados",
    files: "archivos",
    done: "Listo",
    created: "Creado",
    error: "Error",
    generating: "Generando",
    success: "Éxito",
    reading: "Leyendo",
  }
};

export function t(key: keyof typeof messages.en): string {
  const lang = process.env.LANG?.startsWith("es") ? "es" : "en";
  return messages[lang]?.[key] || messages.en[key] || key;
}
