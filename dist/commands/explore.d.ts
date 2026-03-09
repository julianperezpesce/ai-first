export interface ExploreResult {
    success: boolean;
    modules?: string[];
    dependencies?: string[];
    error?: string;
}
export declare function runExplore(rootDir: string, moduleName: string | undefined): Promise<ExploreResult>;
export declare function exploreMain(args: string[]): void;
//# sourceMappingURL=explore.d.ts.map