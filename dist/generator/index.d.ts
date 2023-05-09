import type { ProjectSettings } from '../common_types';
declare type PromptOptions = ProjectSettings & {
    locations: Array<string>;
    privateLocations: Array<string>;
    schedule: number;
};
export declare const REGULAR_FILES_PATH: string[];
export declare const CONFIG_PATH = "synthetics.config.ts";
export declare class Generator {
    projectDir: string;
    pkgManager: string;
    constructor(projectDir: string);
    directory(): Promise<void>;
    questions(): Promise<any>;
    files(answers: PromptOptions): Promise<void>;
    createFile(relativePath: string, content: string, override?: boolean): Promise<void>;
    package(): Promise<void>;
    patchPkgJSON(): Promise<void>;
    patchGitIgnore(): Promise<void>;
    banner(): void;
    setup(): Promise<void>;
}
export {};
//# sourceMappingURL=index.d.ts.map