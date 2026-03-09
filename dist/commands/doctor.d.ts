export interface DoctorResult {
    success: boolean;
    issues: string[];
    warnings: string[];
    checks: {
        name: string;
        status: 'pass' | 'fail' | 'warn';
        message: string;
    }[];
}
export declare function runDoctor(rootDir: string, fixMode: boolean): Promise<DoctorResult>;
export declare function doctorMain(args: string[]): void;
//# sourceMappingURL=doctor.d.ts.map