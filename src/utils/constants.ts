import path from "path";

/**
 * Constantes centralizadas para rutas del sistema ai-first-cli
 * 
 * Esta migración de ai/ a ai-context/ fue realizada para estandarizar
 * la arquitectura y evitar inconsistencias entre comandos.
 */

// Directorio principal de contexto (arquitectura nueva)
export const AI_CONTEXT_DIR = "ai-context";

// Directorio legacy (para compatibilidad hacia atrás)
export const AI_LEGACY_DIR = "ai";

/**
 * Obtiene la ruta completa al directorio ai-context/
 */
export function getAiContextDir(rootDir: string): string {
  return path.join(rootDir, AI_CONTEXT_DIR);
}

/**
 * Obtiene la ruta completa al archivo index.db
 */
export function getIndexDbPath(rootDir: string): string {
  return path.join(rootDir, AI_CONTEXT_DIR, "index.db");
}

/**
 * Obtiene la ruta completa al archivo hierarchy.json
 */
export function getHierarchyPath(rootDir: string): string {
  return path.join(rootDir, AI_CONTEXT_DIR, "hierarchy.json");
}

/**
 * Obtiene la ruta al directorio ccp/
 */
export function getCcpDir(rootDir: string): string {
  return path.join(rootDir, AI_CONTEXT_DIR, "ccp");
}

/**
 * Obtiene la ruta completa a un archivo CCP específico
 */
export function getCcpPath(rootDir: string, name: string): string {
  return path.join(rootDir, AI_CONTEXT_DIR, "ccp", name, "context.json");
}

/**
 * Obtiene la ruta al directorio de features
 */
export function getFeaturesDir(rootDir: string): string {
  return path.join(rootDir, AI_CONTEXT_DIR, "context", "features");
}

/**
 * Obtiene la ruta al directorio de flows
 */
export function getFlowsDir(rootDir: string): string {
  return path.join(rootDir, AI_CONTEXT_DIR, "context", "flows");
}

/**
 * Obtiene la ruta al directorio graph/
 */
export function getGraphDir(rootDir: string): string {
  return path.join(rootDir, AI_CONTEXT_DIR, "graph");
}

/**
 * Verifica si una ruta corresponde al directorio ai-context/ o ai/ legacy
 * Util para excluir estos directorios del análisis
 */
export function isAiDirectory(dirName: string): boolean {
  return dirName === AI_CONTEXT_DIR || dirName === AI_LEGACY_DIR;
}
