import { FileInfo } from "../core/repoScanner.js";
export interface Conventions {
    naming: NamingConventions;
    structure: StructureConventions;
    testing: TestingConventions;
    git: GitConventions;
    codeStyle: CodeStyleConventions;
    description: string;
}
export interface NamingConventions {
    files: string;
    functions: string;
    classes: string;
    variables: string;
    constants: string;
    components: string;
    tests: string;
    directories: string;
}
export interface StructureConventions {
    srcDirectory: string;
    testDirectory: string;
    configDirectory: string;
    sharedDirectory: string;
}
export interface TestingConventions {
    framework: string;
    testFilePattern: string;
    mockPattern: string;
    setupPattern: string;
}
export interface GitConventions {
    branchStrategy: string;
    commitMessageFormat: string;
    prTitleFormat: string;
}
export interface CodeStyleConventions {
    indentation: string;
    quoteStyle: string;
    semicolons: boolean;
    trailingComma: string;
    maxLineLength: number | null;
}
export declare function detectConventions(files: FileInfo[], rootDir: string): Conventions;
export declare function generateConventionsFile(c: Conventions): string;
//# sourceMappingURL=conventions.d.ts.map