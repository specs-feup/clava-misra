import AggregatePassResult from "lara-js/api/lara/pass/results/AggregatePassResult";
import MISRAPassResult from "../MISRAPassResult";
import MISRAReporter from "../MISRAReporter";
import MISRAPass from "../MISRAPass";
import Query from "lara-js/api/weaver/Query";
import { Joinpoint } from "clava-js/api/Joinpoints";
import Clava from "clava-js/api/clava/Clava";
import ClavaJoinPoints from "clava-js/api/clava/ClavaJoinPoints";

function countErrors($passResult: AggregatePassResult): number {
    let count = 0;
    $passResult.results.forEach(res => {
        const misraRes = res as MISRAPassResult;
        console.log(misraRes.reports);
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