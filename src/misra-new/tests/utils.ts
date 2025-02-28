import MISRATool from "../MISRATool.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

export function countMISRAErrors(): number {
    const misraTool = new MISRATool();
    misraTool.checkCompliance();
    return misraTool.getMISRAErrors().length;
}

export function countErrorsAfterCorrection(): number {
    const misraTool = new MISRATool();
    misraTool.applyCorrections();
    return misraTool.getMISRAErrors().length;
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
      Clava.getProgram().rebuild();
      Clava.getProgram().pop();
    });
}
