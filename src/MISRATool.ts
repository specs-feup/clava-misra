import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "./MISRARule.js";
import MISRAContext from "./MISRAContext.js";
import { MISRATransformationType } from "./MISRA.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { resetCaches } from "./utils/ProgramUtils.js";
import { selectRules } from "./rules/index.js";

enum ExecutionMode {
    CORRECTION,
    DETECTION
}

export default class MISRATool {
    static #misraRules: MISRARule[];
    public static context: MISRAContext;
    static readonly #standards = new Set(["c90", "c99", "c11"]);
    static readonly #ruleTypes = new Set(["all", "single", "system"]);

    public static checkCompliance(startingPoint: Program | FileJp = Query.root() as Program) {
        this.init();

        const nodes = [startingPoint, ...startingPoint.descendants];
        for (const node of nodes) {
            for (const rule of this.#misraRules) {
                rule.match(node, true);
            }
        }
        this.outputReport(ExecutionMode.DETECTION);
    } 

    /**
     * Transforms the source code to comply with the coding guidelines. 
     * After the transformation, any violations that could not be fixed will be displayed along with their justification.
     */
    public static correctViolations() {
        this.init();

        // Store config file in context, if provided
        const configFilePath = this.getArgValue("config");
        if (configFilePath) {
            this.context.config = configFilePath;
        }

        let iteration = 0;
        let modified = true;
        while (modified) {
            console.log(`[Clava-MISRATool] Iteration #${++iteration}: Applying MISRA-C transformations...`);
            modified = this.transformAST(Query.root() as Program);
        }
        this.outputReport(ExecutionMode.CORRECTION);
    }

    /**
     * Recursively transforms the AST using a pre-order traversal
     * 
     * @param $jp  AST node from which to start the visit.
     * @returns Return true if any modifications were made (removal, replacement, or changes in descendants). Otherwise, returns false.
     */
    private static transformAST($jp: Joinpoint): boolean {
        let modified = false;

        for (const rule of this.#misraRules) {
            const transformReport = rule.apply($jp);

            if (transformReport.type !== MISRATransformationType.NoChange) {
                modified = true;
                if (transformReport.type === MISRATransformationType.Removal)
                    return modified;
                else if (transformReport.type === MISRATransformationType.Replacement)
                    $jp = transformReport.newNode as Joinpoint;
            }
        }

        for (const child of $jp.children) {
            if (this.transformAST(child)) 
                modified = true;
        }
        return modified;
    }

    private static init() {
        this.validateStdVersion();
        this.context = new MISRAContext();
        resetCaches();
        this.initRules();
    }

    /**
     * Selects applicable rules according to the analysis type. When not specified, both system and single translation unit rules are selected.
     */
    private static initRules() {
        const typeStr = this.getArgValue("type", this.#ruleTypes) ?? "all";
        this.#misraRules = selectRules(this.context, typeStr);
    }

    /**
     * Checks whether the provided standard version is valid and supported
     */
    private static validateStdVersion() {
        const stdVersion = (Query.root() as Program).standard;

        if (!this.#standards.has(stdVersion)) {
            console.error(`[Clava-MISRATool] Invalid -std value. Allowed values: ${[...this.#standards].join(", ")}`);
            process.exit(1);
        }
    }

    private static getArgValue(field: string, validValues?: Set<string>): string | undefined{
        const args = Clava.getData().get("argv") as string;
        if (!args) return undefined;

        const pair = args.split(/\s+/).find(arg => arg.startsWith(field + "="));
        if (!pair) return undefined;

        const value = pair.split("=")[1];
        if (validValues && !validValues.has(value)) {
            console.error(`[Clava-MISRATool] Invalid '${field}' value. Allowed values: ${[...validValues].join(", ")}`);
            process.exit(1);
        }
        return value;
    }

    /**
     * Displays standard violations based on execution mode. 
     * - In detection mode, all violations are shown.
     * - In correction mode, only the remaining violations are displayed
     * 
     * @param mode execution mode 
     */
    private static outputReport(mode: ExecutionMode) {
        const isDetection = mode === ExecutionMode.DETECTION;
        const errorCount = isDetection ? this.getErrorCount() : this.getActiveErrorCount();

        if (errorCount > 0) {
          console.log(isDetection
            ? `[Clava-MISRATool] Detected ${errorCount} MISRA-C violation${errorCount === 1 ? "" : "s"}:\n`
            : `[Clava-MISRATool] ${errorCount} MISRA-C violation${errorCount === 1 ? "" : "s"} remain after transformation:\n`
          );
          isDetection ? this.context.outputAllErrors() : this.context.outputActiveErrors();
        } 
        else {
          console.log(isDetection ? "[Clava-MISRATool] No MISRA-C violations detected.\n" : "[Clava-MISRATool] All detected violations were corrected.\n");
        }
    }

    /**
     * @returns Returns the number of identified violations.
     */
    public static getErrorCount(): number {
        return this.context.errors.length;
    }

    /**
     * @returns Returns the number of active errors linked to nodes that are still present in the AST after correction.
     */
    public static getActiveErrorCount(): number {
        return this.context.activeErrors.length;
    }
}