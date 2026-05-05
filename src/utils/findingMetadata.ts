export interface FindingMetadata {
  confidence: number;
  evidence: string[];
  whyFlagged: string;
}

export function createEvidence(file: string, line: number, sourceLine: string): string[] {
  const location = line > 0 ? `${file}:${line}` : file;
  const snippet = sourceLine.trim().slice(0, 160);
  return snippet ? [location, snippet] : [location];
}

export function confidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
