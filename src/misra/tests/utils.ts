import AggregatePassResult from "@specs-feup/lara/api/lara/pass/results/AggregatePassResult.js";
import MISRAPassResult from "../MISRAPassResult.js";
import MISRAReporter from "../MISRAReporter.js";
import MISRAPass from "../MISRAPass.js";
import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

function countErrors($passResult: AggregatePassResult): number {
    let count = 0;
    $passResult.results.forEach(res => {
        const misraRes = res as MISRAPassResult;
        count += misraRes.reports.length;
    });

    return count;
}

export function expectNumberOfErrors($reporter: MISRAReporter, $pass: MISRAPass, $errors: number, $jp: Joinpoint) {
    const result = $reporter.applyPass($pass, $jp);
    if (!result) {
        expect($errors).toBe(0);
        return;
    }
    expect(countErrors(result)).toBe($errors);
}

export interface TestFile {
    name: string,
    code: string
}

export function registerSourceCode(files: TestFile[]): void {
    beforeAll(() => {
      Clava.getProgram().push();
      const program = Clava.getProgram();
      files.forEach(file => {
        const sourceFile = ClavaJoinPoints.fileWithSource(file.name, file.code);
        program.addFile(sourceFile);
      });
      program.rebuild();
    });
  
    afterAll(() => {
      Clava.getProgram().pop();
    });
  }