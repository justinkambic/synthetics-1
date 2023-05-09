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
import { JourneyEndResult, JourneyStartResult, StepEndResult } from '../common_types';
import { Journey, Step } from '../dsl';
import BaseReporter from './base';
/**
 * JUnit Reporting Format - https://llg.cubic.org/docs/junit/
 */
export default class JUnitReporter extends BaseReporter {
    #private;
    private totalTests;
    private totalFailures;
    private totalSkipped;
    onJourneyStart(journey: Journey, {}: JourneyStartResult): void;
    onStepEnd(journey: Journey, step: Step, { status, error, start, end }: StepEndResult): void;
    onJourneyEnd(journey: Journey, {}: JourneyEndResult): void;
    onEnd(): Promise<void>;
}
//# sourceMappingURL=junit.d.ts.map