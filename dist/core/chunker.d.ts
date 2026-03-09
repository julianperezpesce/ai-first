export interface Chunk {
    id: string;
    content: string;
    filePath: string;
    startLine: number;
    endLine: number;
    type: "function" | "class" | "file";
    name?: string;
    language: string;
}
export interface ChunkOptions {
    maxChunkSize?: number;
    overlap?: number;
}
/**
 * Main chunking function - dispatches to language-specific chunkers
 */
export declare function chunkFile(filePath: string, options?: ChunkOptions): Chunk[];
/**
 * Chunk multiple files
 */
export declare function chunkFiles(filePaths: string[], options?: ChunkOptions): Chunk[];
//# sourceMappingURL=chunker.d.ts.map