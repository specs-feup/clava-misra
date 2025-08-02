import { EnumDecl, FunctionJp, Joinpoint, LabelStmt, RecordJp, TypedefDecl, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import { MISRAError, MISRATransformationResults, MISRATransformationType } from "./MISRA.js";
import * as fs from 'fs';
import Context from "./ast-visitor/Context.js";
import { compareLocation, getFileLocation } from "./utils/JoinpointUtils.js";

/**
 * Tracks MISRA-C violations during the analysis and/or transformation of the code.
 * Also generates unique variable and function names.
 */
export default class MISRAContext extends Context<MISRATransformationResults> {
    /**
     * Stores MISRA-C rule violations.
     * 
     * When checking compliance, this includes all detected violations.
     * When performing transformations, it includes only the violations that could not be resolved.
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
    private sortErrors(errors?: MISRAError[]) {
        let errorList = errors ? errors : this.#misraErrors;
        errorList.sort((error1, error2) => compareLocation(error1.joinpoint, error2.joinpoint));
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

    /**
     * Returns the type of transformation applied by the specified rule to the given AST node.
     * If no transformation was recorded, returns undefined.
     * 
     * @param ruleID Identifier of the violated rule
     * @param $jp AST node
     * @returns The type of transformation applied, or undefined if none was recorded.
     */
    getRuleResult(ruleID: string, $jp: Joinpoint): MISRATransformationType | undefined {
        return this.get(ruleID)?.get($jp.astId);
    }

    /**
     * Registers the type of transformation a rule applied to a AST node
     * @param ruleID Identifier of the violated rule
     * @param $jp 
     * @param result Applied transformation
     */
    addRuleResult(ruleID: string, $jp: Joinpoint, result: MISRATransformationType) {
        let transformations = this.get(ruleID);

        if (transformations === undefined) {
            transformations = new Map();
            this.put(ruleID, transformations);
        }
        transformations.set($jp.astId, result);
    }

    /**
     * Registers a new violation of the standard
     * 
     * @param ruleID Identifier of the violated rule
     * @param $jp Joinpoint where the error was detected
     * @param message Description of the error
     */
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

    /**
     * Outputs a formatted MISRA-C rule violation message
     * 
     * @param error - The MISRA error object containing the rule ID, message, and location
     */
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
        const errors = this.activeErrors;
        this.sortErrors(errors);
        errors.forEach(error => this.outputError(error));
    }
}
