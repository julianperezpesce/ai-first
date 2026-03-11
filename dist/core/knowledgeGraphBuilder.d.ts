export type NodeType = "feature" | "flow" | "file" | "symbol" | "commit";
export type EdgeType = "contains" | "implements" | "declares" | "references" | "modifies";
export interface KnowledgeNode {
    id: string;
    type: NodeType;
    label?: string;
    metadata?: Record<string, unknown>;
}
export interface KnowledgeEdge {
    from: string;
    to: string;
    type: EdgeType;
}
export interface KnowledgeGraph {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
    metadata: {
        generated: string;
        sources: string[];
        nodeCount: number;
        edgeCount: number;
    };
}
export declare function createNodes(aiDir: string): KnowledgeNode[];
export declare function createEdges(aiDir: string): KnowledgeEdge[];
export declare function buildKnowledgeGraph(rootDir: string, aiDir?: string): KnowledgeGraph;
export declare function loadKnowledgeGraph(aiDir: string): KnowledgeGraph | null;
export declare function getNodesByType(graph: KnowledgeGraph, type: NodeType): KnowledgeNode[];
export declare function getEdgesByType(graph: KnowledgeGraph, type: EdgeType): KnowledgeEdge[];
export declare function getNeighbors(graph: KnowledgeGraph, nodeId: string): KnowledgeNode[];
//# sourceMappingURL=knowledgeGraphBuilder.d.ts.map