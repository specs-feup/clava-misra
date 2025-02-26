import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAError from "./MISRAError.js";

export default class MISRAContext {
    #misraErrors: MISRAError[] = [];

    #varCounter = 0;
    #funcCounter = 0;

    #varPrefix = "__misra_var_";
    #funcPrefix = "__misra_func_";

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

    printErrors() {
        for (const error of this.#misraErrors) {
            console.log(error.message);
        }
    }

    get errors(): MISRAError[] {
        return this.#misraErrors;
    }

}
