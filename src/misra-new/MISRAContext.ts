import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { MISRAError } from "./MISRA.js";

export default class MISRAContext {
    #misraErrors: MISRAError[] = [];
    #misraWarnings: MISRAError[] = [];

    #varCounter = 0;
    #funcCounter = 0;

    #varPrefix = "__misra_var_";
    #funcPrefix = "__misra_func_";

    get errors(): MISRAError[] {
        return this.#misraErrors;
    }

    get warnings(): MISRAError[] {
        return this.#misraWarnings;
    }

    generateVarName() {
        return `${this.#varPrefix}${this.#varCounter++}`;
    }

    generateFuncName() {
        return `${this.#funcPrefix}${this.#funcCounter++}`;
    }

    addMISRAError(ruleID: string, $jp: Joinpoint, message: string) {
        const newError = new MISRAError(ruleID, $jp, message);

        if (!this.#misraErrors.some(error => error.equals(newError))) {
            this.#misraErrors.push(newError);
        }
    }

    addMISRAWarning(ruleID: string, $jp: Joinpoint, message: string) {
        const newWarning = new MISRAError(ruleID, $jp, message);

        if (!this.#misraWarnings.some(warning => warning.equals(newWarning))) {
            this.#misraWarnings.push(newWarning);
        }
    }

    printErrors() {
        this.#misraErrors.forEach(error => console.log(error.message));
        console.log(); 
    }
    
    printWarnings() {
        this.#misraWarnings.forEach(warning => console.log(warning.message));
        console.log(); 
    }

}
