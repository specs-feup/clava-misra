import MISRATool from "../MISRATool.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { FileJp, Program } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import * as os from 'os';
import { resetCaches } from "../utils/ProgramUtils.js";

export function countMISRAErrors(): number;
export function countMISRAErrors(ruleID: string): number;
export function countMISRAErrors(startingPoint: FileJp | Program): number;
export function countMISRAErrors(startingPoint: FileJp | Program, ruleID: string): number;

export function countMISRAErrors(arg1?: FileJp | Program | string, arg2?: string): number {
  let startingPoint: FileJp | Program;
  let ruleID: string | undefined;

  if (typeof arg1 === "string") {
    ruleID = arg1;
    startingPoint = Query.root() as Program;
  } else {
    startingPoint = arg1 ?? (Query.root() as Program);
    ruleID = arg2;
  }

  MISRATool.checkCompliance(startingPoint);
  
  return ruleID ? 
    MISRATool.context.errors.filter(error => error.ruleID === ruleID).length :
    MISRATool.getErrorCount();
}

export function countErrorsAfterCorrection(ruleID?: string): number {
  MISRATool.correctViolations();

  return ruleID ? 
    MISRATool.context.activeErrors.filter(error => error.ruleID === ruleID).length :
    MISRATool.getActiveErrorCount();
}

export interface TestFile {
    name: string,
    code: string
    path?: string
}

export function registerSourceCode(files: TestFile[], configPath?: string): void {
    beforeEach(() => {
      resetCaches();

      const dataStore = Clava.getData();
      dataStore.setStandard(process.env.STD_VERSION!);
      dataStore.put("argv", configPath ? `config=${configPath}` : undefined);

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
