import MISRATool from "../MISRATool.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { FileJp, Program } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import * as os from 'os';

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
      const dataStore = Clava.getData();

      dataStore.setStandard(process.env.STD_VERSION!);

      // If running on macOS, change libcCxxMode
      if (os.platform() === 'darwin') {
        const key = "libcCxxMode";
        const allowedValues = dataStore.getType(key).getEnumConstants();
        const systemValue = allowedValues.find((value: any) => value.name() === "SYSTEM");
        dataStore.put(key, systemValue);
      }

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
