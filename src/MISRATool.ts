import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Call, FileJp, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "./MISRARule.js";
import sortRules from "./rules/index.js";
import MISRAContext from "./MISRAContext.js";
import { MISRAError, MISRATransformationType } from "./MISRA.js";

export default class MISRATool {
    static #misraRules: MISRARule[];
    static #context: MISRAContext;

    private static init(startingPoint: FileJp | Program) {
        this.validateStdVersion(startingPoint);
        this.#context = new MISRAContext();
        this.#misraRules = sortRules(this.#context);
    }

    private static validateStdVersion(startingPoint: FileJp | Program) {
        const allowedVersions = ["c90", "c99", "c11"];
        const stdVersion = startingPoint instanceof Program ? startingPoint.standard : (startingPoint.root as Program).standard;

        if (!allowedVersions.includes(stdVersion)) {
            console.error(`[Clava-MISRATool] Invalid --std value. Allowed values: ${allowedVersions.join(", ")}`);
            process.exit(1);
        }
    }

    public static checkCompliance(startingPoint: Program | FileJp = Query.root() as Program) {
        this.init(startingPoint);

        const nodes = [startingPoint, ...startingPoint.descendants];
        for (const node of nodes) {
            for (const rule of this.#misraRules) {
                rule.match(node, true);
            }
        }
        if (this.#context.errors.length > 0) {
            console.log("[Clava-MISRATool] Detected violations:\n")
            this.#context.printAllErrors();
        } else {
            console.log("[Clava-MISRATool] No MISRA-C violations detected.");
        }
    } 

    public static applyCorrections(configFilePath?: string) {
        this.init(Query.root() as Program);
        if (configFilePath) {
            this.#context.config = configFilePath;
        }

        let iteration = 0;
        let modified = false;
        do {
            console.log(`[Clava-MISRATool] Iteration #${++iteration}: Applying MISRA-C transformations...`);
            modified = this.transformAST(Query.root() as Program);
        } while(modified);

        if (this.#context.errors.length === 0) {
            console.log("[Clava-MISRATool] All detected violations were corrected.");
        } else {
            console.log("\n[Clava-MISRATool] Remaining MISRA-C violations:");
            this.#context.printActiveErrors();
        }
    }

    private static transformAST($jp: Joinpoint): boolean {
        let modified = false;

        for (const rule of this.#misraRules) {
            const transformReport = rule.transform($jp);

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
}