import fs from "fs";
import path from "path";
import crypto from "crypto";
/**
 * Generate a simple hash-based embedding (for testing/fallback)
 * This creates a deterministic embedding based on content
 */
function generateSimpleEmbedding(text, dimensions = 384) {
    // Use MD5 hash to seed random-like but deterministic values
    const hash = crypto.createHash("md5").update(text).digest();
    const vector = [];
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
export async function generateEmbeddings(chunks, options = {}) {
    const dimensions = options.dimensions || 384;
    let model = options.model || "simple";
    let embeddings = [];
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
 * Save embeddings to file
 */
export function saveEmbeddings(embeddings, aiDir, model, dimensions) {
    const index = {
        version: "1.0.0",
        model,
        dimensions,
        generated: new Date().toISOString(),
        embeddings
    };
    const embeddingsPath = path.join(aiDir, "embeddings.json");
    fs.writeFileSync(embeddingsPath, JSON.stringify(index, null, 2));
    console.log(`   ✅ Saved ${embeddings.length} embeddings to ${embeddingsPath}`);
}
/**
 * Load embeddings from file
 */
export function loadEmbeddings(aiDir) {
    const embeddingsPath = path.join(aiDir, "embeddings.json");
    if (!fs.existsSync(embeddingsPath)) {
        return null;
    }
    try {
        const data = fs.readFileSync(embeddingsPath, "utf-8");
        return JSON.parse(data);
    }
    catch {
        return null;
    }
}
/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
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
 * Search embeddings for similar chunks
 */
export function searchEmbeddings(query, embeddingsIndex, topK = 5) {
    // Generate embedding for query
    const queryEmbedding = generateSimpleEmbedding(query, embeddingsIndex.dimensions);
    // Calculate similarities
    const results = embeddingsIndex.embeddings.map(embedding => ({
        chunkId: embedding.id,
        filePath: embedding.metadata.filePath,
        score: cosineSimilarity(queryEmbedding, embedding.vector),
        startLine: embedding.metadata.startLine,
        endLine: embedding.metadata.endLine,
        type: embedding.metadata.type
    }));
    // Sort by score and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK).map(r => ({
        chunkId: r.chunkId,
        filePath: r.filePath,
        score: r.score,
        content: `[${r.filePath}:${r.startLine}-${r.endLine}] (${r.type})`
    }));
}
//# sourceMappingURL=embeddings.js.map