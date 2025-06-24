import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "./MISRARule.js";
import sortRules from "./rules/index.js";
import MISRAContext from "./MISRAContext.js";
import { MISRATransformationType } from "./MISRA.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { resetCaches } from "./utils/ProgramUtils.js";

export default class MISRATool {
    static #misraRules: MISRARule[];
    static #context: MISRAContext;

    private static init() {
        this.validateStdVersion();
        this.#context = new MISRAContext();
        resetCaches();
        this.#misraRules = sortRules(this.#context);
    }

    private static validateStdVersion() {
        const allowedVersions = ["c90", "c99", "c11"];
        const stdVersion = (Query.root() as Program).standard;

        if (!allowedVersions.includes(stdVersion)) {
            console.error(`[Clava-MISRATool] Invalid --std value. Allowed values: ${allowedVersions.join(", ")}`);
            process.exit(1);
        }
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

        const configFilePath = Clava.getData().get("argv");
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