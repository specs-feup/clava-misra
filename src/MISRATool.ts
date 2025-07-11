import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "./MISRARule.js";
import MISRAContext from "./MISRAContext.js";
import { MISRATransformationType } from "./MISRA.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { resetCaches } from "./utils/ProgramUtils.js";
import { selectRules } from "./rules/index.js";

export default class MISRATool {
    static #misraRules: MISRARule[];
    static #context: MISRAContext;

    private static init() {
        this.validateStdVersion();
        this.#context = new MISRAContext();
        resetCaches();
        this.initRules();
    }

    private static validateStdVersion() {
        const validVersions = ["c90", "c99", "c11"];
        const stdVersion = (Query.root() as Program).standard;

        if (!validVersions.includes(stdVersion)) {
            console.error(`[Clava-MISRATool] Invalid -std value. Allowed values: ${validVersions.join(", ")}`);
            process.exit(1);
        }
    }

    private static initRules() {
        const validTypes = ["all", "system", "single"];
        const typeStr = this.getArgValue("type", validTypes) ?? "all";
        this.#misraRules = selectRules(this.#context, typeStr);
    }

    private static getArgValue(field: string, validValues?: string[]): string | undefined{
        const args = Clava.getData().get("argv") as string;
        if (!args) return undefined;

        const pair = args.split(/\s+/).find(arg => arg.startsWith(field + "="));
        if (!pair) return undefined;

        const value = pair.split("=")[1];
        if (validValues && !validValues.includes(value)) {
            console.error(`[Clava-MISRATool] Invalid '${field}' value. Allowed values: ${validValues.join(", ")}`);
            process.exit(1);
        }
        return value;
    }

    public static checkCompliance(startingPoint: Program | FileJp = Query.root() as Program) {
        this.init();

        const nodes = [startingPoint, ...startingPoint.descendants];
        for (const node of nodes) {
            for (const rule of this.#misraRules) {
                rule.match(node, true);
            }
        }
        if (this.getErrorCount() > 0) {
            console.log(`[Clava-MISRATool] Detected ${this.getErrorCount()} MISRA-C violation${this.getErrorCount() === 1 ? '' : 's'}:\n`);
            this.#context.printAllErrors();
        } else {
            console.log("[Clava-MISRATool] No MISRA-C violations detected.");
        }
    } 

    public static applyCorrections() {
        this.init();

        const configFilePath = this.getArgValue("config");
        if (configFilePath) {
            this.#context.config = configFilePath;
        }

        let iteration = 0;
        let modified = true;
        while (modified) {
            console.log(`[Clava-MISRATool] Iteration #${++iteration}: Applying MISRA-C transformations...`);
            modified = this.transformAST(Query.root() as Program);
        }

        if (this.getActiveErrorCount() === 0) {
            console.log("[Clava-MISRATool] All detected violations were corrected.\n");
        } else {
            console.log(`\n[Clava-MISRATool] ${this.getActiveErrorCount()} MISRA-C violation${this.getActiveErrorCount() === 1 ? '' : 's'} remain after transformation:\n`);
            this.#context.printActiveErrors();
        }
    }

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

    public static getErrorCount(): number {
        return this.#context.errors.length;
    }

    public static getActiveErrorCount(): number {
        return this.#context.activeErrors.length;
    }

    public static get context() {
        return this.#context;
    }
}