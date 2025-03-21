import MISRATool from "../MISRATool.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { Field, FileJp, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export function countMISRAErrors(startingPoint: FileJp | Program = Query.root() as Program): number {
  MISRATool.checkCompliance(startingPoint);
  return MISRATool.getMISRAErrors().length;
}

export function countErrorsAfterCorrection(startingPoint: FileJp | Program = Query.root() as Program): number {
  MISRATool.applyCorrections(startingPoint);
  return MISRATool.getMISRAErrors().length;
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
