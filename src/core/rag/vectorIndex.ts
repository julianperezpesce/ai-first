import fs from 'fs';
import path from 'path';

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    filePath: string;
    language?: string;
    type?: 'function' | 'class' | 'interface' | 'variable';
  };
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
}

export class VectorIndex {
  private documents: Map<string, VectorDocument> = new Map();
  private indexPath: string;

  constructor(indexPath: string) {
    this.indexPath = indexPath;
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.indexPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
        this.documents = new Map(Object.entries(data));
      } catch {
        this.documents = new Map();
      }
    }
  }

  save(): void {
    const data = Object.fromEntries(this.documents);
    fs.writeFileSync(this.indexPath, JSON.stringify(data, null, 2));
  }

  addDocument(doc: VectorDocument): void {
    this.documents.set(doc.id, doc);
  }

  search(query: string, topK: number = 5): SearchResult[] {
    const queryEmbedding = this.simpleEmbedding(query);
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
      results.push({ document: doc, score });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private simpleEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding: number[] = new Array(100).fill(0);
    
    for (let i = 0; i < words.length && i < 100; i++) {
      let hash = 0;
      for (const char of words[i]) {
        hash = ((hash << 5) - hash) + char.charCodeAt(0);
        hash = hash & hash;
      }
      embedding[i] = Math.sin(hash) * 0.5 + 0.5;
    }
    
    return embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export function createVectorIndex(indexPath: string): VectorIndex {
  return new VectorIndex(indexPath);
}

export function semanticSearch(
  index: VectorIndex,
  query: string,
  topK: number = 5
): SearchResult[] {
  return index.search(query, topK);
}
