import { FileInfo } from "../core/repoScanner.js";
export interface Entrypoint {
    name: string;
    path: string;
    type: "cli" | "api" | "worker" | "server" | "client" | "library" | "config" | "test" | "build" | "lint" | "formatter" | "other";
    description: string;
    command?: string;
}
export declare function discoverEntrypoints(files: FileInfo[], rootDir: string): Entrypoint[];
export declare function generateEntrypointsFile(entrypoints: Entrypoint[]): string;
//# sourceMappingURL=entrypoints.d.ts.map