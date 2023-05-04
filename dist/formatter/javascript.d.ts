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
import { JavaScriptLanguageGenerator } from 'playwright-core/lib/server/recorder/javascript';
export declare type Step = {
  actions: ActionInContext[];
  name?: string;
};
export declare type Steps = Step[];
export declare type FrameDescription = {
  pageAlias: string;
  isMainFrame?: boolean;
  url: string;
  name?: string;
  selectorsChain?: string[];
};
export declare type ActionInContext = {
  frameName?: string;
  action: Action;
  committed?: boolean;
  modified?: boolean;
  title?: string;
  frame: FrameDescription;
  isOpen?: boolean;
  isSoftDeleted?: boolean;
};
export declare type Action = {
  name: string;
  selector?: string;
  url?: string;
  key?: string;
  signals: Signal[];
  modifiers?: number;
  button?: 'left' | 'middle' | 'right';
  clickCount?: number;
  text?: string;
  value?: string;
  isAssert?: boolean;
  command?: string;
  files?: string[];
  options?: string[];
};
export declare type Signal = {
  name: string;
  url?: string;
  isAsync?: boolean;
  popupAlias?: string;
  downloadAlias?: string;
  dialogAlias?: string;
};
export declare function quote(text: string, char?: string): string;
/**
 * Generates an appropriate title string based on the action type/data.
 * @param action Playwright action IR
 * @returns title string
 */
export declare function actionTitle(action: Action): string;
export declare class SyntheticsGenerator extends JavaScriptLanguageGenerator {
  private isProject;
  private previousContext?;
  private insideStep;
  private varsToHoist;
  constructor(isProject: boolean);
  /**
   * Generate code for an action.
   * @param actionInContext The action to create code for.
   * @returns the strings generated for the action.
   */
  generateAction(actionInContext: ActionInContext): any;
  isNewStep(actioninContext: ActionInContext): boolean;
  generateStepStart(name: string): any;
  generateStepEnd(): any;
  generateHeader(): any;
  generateFooter(): string;
  /**
   * Generates JavaScript code from a custom set of steps and nested actions.
   *
   * This function makes no assumptions about where steps should be created,
   * and instead follows the step definitions the caller has defined.
   * @param steps IR to use for code generation
   * @returns a list of the code strings outputted by the generator
   */
  generateFromSteps(steps: Steps): string;
  generateHoistedVars(): any;
  isVarHoisted(varName: string): boolean;
  getDefaultOffset(): 0 | 2;
  /**
   * We need to hoist any page or popup alias that appears in more than one step.
   * @param steps the step IR to evaluate
   * @returns an array that contains the names of all variables that need to be hoisted
   */
  findVarsToHoist(steps: Steps): string[];
}
//# sourceMappingURL=javascript.d.ts.map
