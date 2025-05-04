import MISRATool from "../MISRATool.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { FileJp, Program } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export function countMISRAErrors(startingPoint: FileJp | Program = Query.root() as Program): number {
  MISRATool.checkCompliance(startingPoint);
  return MISRATool.getErrorCount();
}

export function countErrorsAfterCorrection(configPath?: string): number {
  MISRATool.applyCorrections(configPath);
  return MISRATool.getActiveErrorCount();
}

export interface TestFile {
    name: string,
    code: string
    path?: string
}

export function registerSourceCode(files: TestFile[]): void {
    beforeEach(() => {
      Clava.getData().setStandard(process.env.STD_VERSION!);
      Clava.getProgram().push();
      const program = Clava.getProgram();
      files.forEach(file => {
        const sourceFile = ClavaJoinPoints.fileWithSource(file.name, file.code, file.path);
        program.addFile(sourceFile);
      });
      program.rebuild();
    });
  
    afterEach(() => {
      Clava.getProgram().rebuild();
      Clava.getProgram().pop();
    });
}
