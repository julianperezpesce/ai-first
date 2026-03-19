import crypto from "crypto";
import { Database } from "sql.js";
import { Chunk } from "./chunker.js";

export interface Embedding {
  id: string;
  vector: number[];
  metadata: {
    chunkId: string;
    filePath: string;
    startLine: number;
    endLine: number;
    type: string;
    language: string;
  };
}

export interface EmbeddingsIndex {
  version: string;
  model: string;
  dimensions: number;
  generated: string;
  embeddings: Embedding[];
}

/**
 * Create embeddings table in the database
 */
export function createEmbeddingsTable(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS embeddings (
      id TEXT PRIMARY KEY,
      vector TEXT NOT NULL,
      metadata TEXT NOT NULL,
      chunk_id TEXT,
      file_path TEXT,
      start_line INTEGER,
      end_line INTEGER,
      type TEXT,
      language TEXT
    )
  `);
  db.run("CREATE INDEX IF NOT EXISTS idx_embeddings_file_path ON embeddings(file_path)");
}

/**
 * Generate a simple hash-based embedding (for testing/fallback)
 * This creates a deterministic embedding based on content
 */
function generateSimpleEmbedding(text: string, dimensions: number = 384): number[] {
  // Use MD5 hash to seed random-like but deterministic values
  const hash = crypto.createHash("md5").update(text).digest();
  const vector: number[] = [];
  
  for (let i = 0; i < dimensions; i++) {
    // Use hash bytes cyclically to generate values between -1 and 1
    const byteIndex = i % hash.length;
    const value = (hash[byteIndex] / 255) * 2 - 1;
    vector.push(value);
  }
  
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map(v => v / magnitude);
}

/**
 * Generate embeddings using local model (sentence-transformers)
 * or fallback to simple embeddings
 */
export async function generateEmbeddings(
  chunks: Chunk[],
  options: {
    model?: string;
    dimensions?: number;
    useLocal?: boolean;
  } = {}
): Promise<{ embeddings: Embedding[]; model: string }> {
  const dimensions = options.dimensions || 384;
  let model = options.model || "simple";
  let embeddings: Embedding[] = [];
  
  // Use simple embeddings (for now)
  // TODO: Add support for @xenova/transformers when available
  model = "simple-fallback";
  console.log("   Using simple embeddings (install @xenova/transformers for better results)");
  
  for (const chunk of chunks) {
    embeddings.push({
      id: chunk.id,
      vector: generateSimpleEmbedding(chunk.content, dimensions),
      metadata: {
        chunkId: chunk.id,
        filePath: chunk.filePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        type: chunk.type,
        language: chunk.language
      }
    });
  }

  
  return { embeddings, model };
}

/**
 * Save embeddings to SQLite database
 */
export function saveEmbeddings(
  db: Database,
  embeddings: Embedding[],
  model: string,
  dimensions: number
): void {
  db.run("DELETE FROM embeddings");
  
  for (const embedding of embeddings) {
    const vectorJson = JSON.stringify(embedding.vector);
    const metadataJson = JSON.stringify(embedding.metadata);
    
    db.run(
      `INSERT INTO embeddings (id, vector, metadata, chunk_id, file_path, start_line, end_line, type, language) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        embedding.id,
        vectorJson,
        metadataJson,
        embedding.metadata.chunkId,
        embedding.metadata.filePath,
        embedding.metadata.startLine,
        embedding.metadata.endLine,
        embedding.metadata.type,
        embedding.metadata.language
      ]
    );
  }
  
  console.log(`   ✅ Saved ${embeddings.length} embeddings to database`);
}

/**
 * Load embeddings from SQLite database
 */
export function loadEmbeddings(db: Database): EmbeddingsIndex | null {
  try {
    const result = db.exec("SELECT id, vector, metadata FROM embeddings");
    
    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }
    
    const embeddings: Embedding[] = [];
    
    for (const row of result[0].values) {
      const id = row[0] as string;
      const vectorJson = row[1] as string;
      const metadataJson = row[2] as string;
      
      embeddings.push({
        id,
        vector: JSON.parse(vectorJson),
        metadata: JSON.parse(metadataJson)
      });
    }
    
    return {
      version: "1.0.0",
      model: "simple-fallback",
      dimensions: embeddings.length > 0 ? embeddings[0].vector.length : 384,
      generated: new Date().toISOString(),
      embeddings
    };
  } catch {
    return null;
  }
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search embeddings for similar chunks using SQLite database
 */
export function searchEmbeddings(
  db: Database,
  query: string,
  dimensions: number = 384,
  topK: number = 5
): { chunkId: string; filePath: string; score: number; content: string }[] {
  const queryEmbedding = generateSimpleEmbedding(query, dimensions);
  
  const result = db.exec("SELECT id, vector, metadata FROM embeddings");
  
  if (result.length === 0 || result[0].values.length === 0) {
    return [];
  }
  
  const searchResults: { chunkId: string; filePath: string; score: number; startLine: number; endLine: number; type: string }[] = [];
  
  for (const row of result[0].values) {
    const id = row[0] as string;
    const vectorJson = row[1] as string;
    const metadataJson = row[2] as string;
    
    const vector = JSON.parse(vectorJson);
    const metadata = JSON.parse(metadataJson);
    
    searchResults.push({
      chunkId: id,
      filePath: metadata.filePath,
      score: cosineSimilarity(queryEmbedding, vector),
      startLine: metadata.startLine,
      endLine: metadata.endLine,
      type: metadata.type
    });
  }
  
  searchResults.sort((a, b) => b.score - a.score);
  
  return searchResults.slice(0, topK).map(r => ({
    chunkId: r.chunkId,
    filePath: r.filePath,
    score: r.score,
    content: `[${r.filePath}:${r.startLine}-${r.endLine}] (${r.type})`
  }));
}
