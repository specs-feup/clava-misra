import { EnumDecl, FunctionJp, Joinpoint, LabelStmt, RecordJp, TypedefDecl, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { MISRAError, MISRATransformationResults, MISRATransformationType } from "./MISRA.js";
import * as fs from 'fs';
import Context from "./ast-visitor/Context.js";
import { compareLocation, getFileLocation } from "./utils/JoinpointUtils.js";

/**
 * Tracks MISRA errors and warnings during the analysis and/or transformation of the code.
 * Also generated unique variable and function names.
 */
export default class MISRAContext extends Context<MISRATransformationResults> {
    /**
     * List of MISRA errors, that could not be resolved during the transformation process
     */
    #misraErrors: MISRAError[] = [];
    #misraErrorKeys = new Set<string>();

    /**
     * User-provided configuration to assist in violation correction
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

    /**
     * Returns all violations found in the source code.
     */
    get errors(): MISRAError[] {
        return this.#misraErrors;
    }

    /**
     * Returns violations linked to nodes that are still present in the AST after correction.
     */
    get activeErrors(): MISRAError[] {
        return this.#misraErrors.filter(error => error.isActiveError());
    }

    /**
     * Orders errors according to their location
     */
    private sortErrors() {
        this.errors.sort((error1, error2) => compareLocation(error1.joinpoint, error2.joinpoint));
    }

   /**
    * Returns the user-provided configuration that assists in violation correction, if provided. Otherwise, returns undefined. 
    */
    get config(): Map<string, any> | undefined {
        return this.#config;
    }

    /**
     * Loads the JSON config file and transforms it into an internal Map representation.
     * If the file does not exist, logs an error and exits the process.
     */
    set config(configFilePath: string) {
        if (fs.existsSync(configFilePath)) {
            const data = fs.readFileSync(configFilePath, 'utf-8');
            this.#config = new Map(Object.entries(JSON.parse(data)));
        } else {
            console.error(`[Clava-MISRATool] Provided configuration file was not found.`);
            process.exit(1);
        }
    }

    /**
     * Clears stored information.
     */
    resetStorage() {
        [...this.storage.keys()].forEach(key => {
            this.storage.set(key, new Map())
        });
        this.#misraErrors = [];
        this.#misraErrorKeys = new Set<string>();
    }

    getRuleResult(ruleID: string, $jp: Joinpoint): MISRATransformationType | undefined {
        return this.get(ruleID)?.get($jp.astId);
    }

    addRuleResult(ruleID: string, $jp: Joinpoint, result: MISRATransformationType) {
        let transformations = this.get(ruleID);

        if (transformations === undefined) {
            transformations = new Map();
            this.put(ruleID, transformations);
        }
        transformations.set($jp.astId, result);
    }

    addMISRAError(ruleID: string, $jp: Joinpoint, message: string) {
        const key = `${ruleID}-${$jp.astId}-${message}`;
        if (!this.#misraErrorKeys.has(key)) {
            this.#misraErrorKeys.add(key);
            this.#misraErrors.push(new MISRAError(ruleID, $jp, message));
        }
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

    private outputError(error: MISRAError): void {
        console.log(`- [Rule ${error.ruleID}] at ${getFileLocation(error.joinpoint)}: ${error.message}\n`);
    }
    
    /**
     * Displays all violations found in the source code.
     */
    outputAllErrors(): void {
        this.sortErrors();
        this.#misraErrors.forEach(error => this.outputError(error));
    }
    
    /**
     * Displays violations linked to nodes that are still present in the AST after correction.
     */
    outputActiveErrors(): void {
        this.sortErrors();
        this.activeErrors.forEach(error => this.outputError(error));
    }
}
