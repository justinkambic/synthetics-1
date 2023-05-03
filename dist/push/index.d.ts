import { Monitor } from '../dsl/monitor';
import type { PushOptions, ProjectSettings } from '../common_types';
export declare function push(monitors: Monitor[], options: PushOptions): Promise<void>;
export declare function formatDuplicateError(monitors: Set<Monitor>): string;
export declare function loadSettings(): Promise<ProjectSettings>;
export declare function validateSettings(opts: PushOptions): void;
export declare function catchIncorrectSettings(settings: ProjectSettings, options: PushOptions): Promise<void>;
export declare function pushLegacy(monitors: Monitor[], options: PushOptions, version: number): Promise<void>;
//# sourceMappingURL=index.d.ts.map