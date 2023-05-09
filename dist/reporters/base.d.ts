/**
 * MIT License
 *
 * Copyright (c) 2020-present, Elastic NV
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
import SonicBoom from 'sonic-boom';
import { Reporter, ReporterOptions } from '.';
import { JourneyEndResult, JourneyStartResult, StepEndResult } from '../common_types';
import { Journey, Step } from '../dsl';
export default class BaseReporter implements Reporter {
    stream: SonicBoom;
    fd: number;
    metrics: {
        succeeded: number;
        failed: number;
        skipped: number;
    };
    constructor(options?: ReporterOptions);
    onJourneyStart(journey: Journey, {}: JourneyStartResult): void;
    onStepEnd(_: Journey, step: Step, result: StepEndResult): void;
    onJourneyEnd(_: Journey, { error }: JourneyEndResult): void;
    onEnd(): void;
    write(message: any): void;
}
//# sourceMappingURL=base.d.ts.map