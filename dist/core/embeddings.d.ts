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
export declare function createEmbeddingsTable(db: Database): void;
/**
 * Generate embeddings using local model (sentence-transformers)
 * or fallback to simple embeddings
 */
export declare function generateEmbeddings(chunks: Chunk[], options?: {
    model?: string;
    dimensions?: number;
    useLocal?: boolean;
}): Promise<{
    embeddings: Embedding[];
    model: string;
}>;
/**
 * Save embeddings to SQLite database
 */
export declare function saveEmbeddings(db: Database, embeddings: Embedding[], model: string, dimensions: number): void;
/**
 * Load embeddings from SQLite database
 */
export declare function loadEmbeddings(db: Database): EmbeddingsIndex | null;
/**
 * Search embeddings for similar chunks using SQLite database
 */
export declare function searchEmbeddings(db: Database, query: string, dimensions?: number, topK?: number): {
    chunkId: string;
    filePath: string;
    score: number;
    content: string;
}[];
//# sourceMappingURL=embeddings.d.ts.map