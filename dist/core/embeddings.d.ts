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
 * Save embeddings to file
 */
export declare function saveEmbeddings(embeddings: Embedding[], aiDir: string, model: string, dimensions: number): void;
/**
 * Load embeddings from file
 */
export declare function loadEmbeddings(aiDir: string): EmbeddingsIndex | null;
/**
 * Search embeddings for similar chunks
 */
export declare function searchEmbeddings(query: string, embeddingsIndex: EmbeddingsIndex, topK?: number): {
    chunkId: string;
    filePath: string;
    score: number;
    content: string;
}[];
//# sourceMappingURL=embeddings.d.ts.map