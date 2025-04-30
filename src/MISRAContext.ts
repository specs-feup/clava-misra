import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { MISRAError } from "./MISRA.js";
import * as fs from 'fs';

/**
 * Tracks MISRA errors and warnings during the analysis and/or transformation of the code.
 * Also generated unique variable and function names.
 */
export default class MISRAContext {
    /**
     * List of MISRA errors, that could not be resolved during the transformation process
     */
    #misraErrors: MISRAError[] = [];

    /**
     * Configuration provided by the user to assist in rule corrections
     */
    #config: Map<string, any> | undefined = undefined;

    #varCounter = 0;
    #funcCounter = 0;
    #headerCounter = 0;

    #varPrefix = "__misra_var_";
    #funcPrefix = "__misra_func_";
    #headerPrefix = "misra_hdr_";

    get errors(): MISRAError[] {
        return this.#misraErrors;
    }

    get config(): Map<string, any> | undefined {
        return this.#config;
    }

    set config(configFilePath: string) {
        if (fs.existsSync(configFilePath)) {
            const data = fs.readFileSync(configFilePath, 'utf-8');
            this.#config = new Map(Object.entries(JSON.parse(data)));
        } else {
            console.error(`[Clava-MISRATool] Provided configuration file was not found.`);
            process.exit(1);
        }
    }

    generateVarName() {
        return `${this.#varPrefix}${this.#varCounter++}`;
    }

    generateFuncName() {
        return `${this.#funcPrefix}${this.#funcCounter++}`;
    }

    generateHeaderFilename() {
        return `${this.#headerPrefix}${this.#headerCounter++}.h`;
    }

    addMISRAError(ruleID: string, $jp: Joinpoint, message: string) {
        const newError = new MISRAError(ruleID, $jp, message);

        if (!this.#misraErrors.some(error => error.equals(newError))) {
            this.#misraErrors.push(newError);
        }
    }

    printErrors() {
        this.#misraErrors.forEach(error => {
            console.log(`MISRA-C Rule ${error.ruleID} violation at ${error.$jp.filepath}@${error.$jp.line}:${error.$jp.column}: ${error.message}\n`);
        });
    }
}
