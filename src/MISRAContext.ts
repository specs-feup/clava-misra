import { EnumDecl, FunctionJp, Joinpoint, LabelStmt, RecordJp, TypedefDecl, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { MISRAError, MISRATransformationResults, MISRATransformationType } from "./MISRA.js";
import * as fs from 'fs';
import Context from "./ast-visitor/Context.js";

/**
 * Tracks MISRA errors and warnings during the analysis and/or transformation of the code.
 * Also generated unique variable and function names.
 */
export default class MISRAContext extends Context<MISRATransformationResults> {
    /**
     * List of MISRA errors, that could not be resolved during the transformation process
     */
    #misraErrors: MISRAError[] = [];

    /**
     * Configuration provided by the user to assist in rule corrections
     */
    #config: Map<string, any> | undefined = undefined;

    #varCounter = 0;
    #functionCounter = 0;
    #labelCounter = 0;
    #typeDefCounter = 0;
    #enumCounter = 0;
    #structCounter = 0;
    #unionCounter = 0;

    #varPrefix = "_misra_var_";
    #funcPrefix = "_misra_func_";
    #labelPrefix = "_misra_label_";
    #typeDefPrefix = "_misra_typedef_";
    #enumPrefix = "_misra_enum_";
    #structPrefix = "_misra_struct_";
    #unionPrefix = "_misra_union_";


    getRuleResult(ruleID: string, $jp: Joinpoint): MISRATransformationType | undefined {
        return this.get(ruleID)?.get($jp.astId);
    }

    addRuleResult(ruleID: string, $jp: Joinpoint, result: MISRATransformationType) {
        let transformations = this.get(ruleID);
        transformations?.set($jp.astId, result);
    }

    generateIdentifierName($jp: Joinpoint) {
        if ($jp instanceof Vardecl) {
            return `${this.#varPrefix}${this.#varCounter++}`;
        } else if ($jp instanceof FunctionJp) {
            return `${this.#funcPrefix}${this.#functionCounter++}`;
        } else if ($jp instanceof LabelStmt) {
            return `${this.#labelPrefix}${this.#labelCounter++}`;
        } else if ($jp instanceof TypedefDecl) {
            return `${this.#typeDefPrefix}${this.#typeDefCounter++}`;
        } else if ($jp instanceof EnumDecl) {
            return `${this.#enumPrefix}${this.#enumCounter++}`;
        } else if ($jp instanceof RecordJp) {
            return $jp.kind === `struct` ? 
                `${this.#structPrefix}${this.#structCounter++}` :
                `${this.#unionPrefix}${this.#unionCounter++}`
        }
    }

    get errors(): MISRAError[] {
        return this.#misraErrors;
    }

    get activeErrors(): MISRAError[] {
        return this.#misraErrors.filter(error => error.isActiveError());
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

    addMISRAError(ruleID: string, $jp: Joinpoint, message: string) {
        const newError = new MISRAError(ruleID, $jp, message);

        if (!this.#misraErrors.some(error => error.equals(newError))) {
            this.#misraErrors.push(newError);
        }
    }

    private printError(error: MISRAError): void {
        console.log(`- [Rule ${error.ruleID}] at ${error.$jp.filepath}@${error.$jp.line}:${error.$jp.column}: ${error.message}\n`);
    }
    
    printAllErrors(): void {
        this.#misraErrors.forEach(error => this.printError(error));
    }
    
    printActiveErrors(): void {
        this.#misraErrors
            .filter(error => error.isActiveError())
            .forEach(error => this.printError(error));
    }
    
}
