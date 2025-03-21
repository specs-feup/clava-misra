import Query from "@specs-feup/lara/api/weaver/Query.js";
import { FileJp, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "./MISRARule.js";
import misraRules from "./rules/index.js";
import MISRAContext from "./MISRAContext.js";
import { MISRAError, MISRATransformationType } from "./MISRA.js";

export default class MISRATool {
    static #misraRules: MISRARule[];
    static #context: MISRAContext;

    private static init(startingPoint: FileJp | Program) {
        this.validateStdVersion(startingPoint);
        this.#context = new MISRAContext();
        this.#misraRules = misraRules(this.#context);
    }

    private static validateStdVersion(startingPoint: FileJp | Program) {
        const allowedVersions = ["c90", "c99", "c11"];
        const stdVersion = startingPoint instanceof Program ? startingPoint.standard : (startingPoint.getAncestor("program") as Program).standard;
        if (!allowedVersions.includes(stdVersion)) {
            console.error(
              `Invalid --std value. Allowed values: ${allowedVersions.join(", ")}`
            );
            process.exit(1);
        }
    }

    public static checkCompliance(startingPoint: Program | FileJp = Query.root() as Program) {
        this.init(startingPoint);

        const nodes = startingPoint.descendants;
        for (const node of nodes) {
            for (const rule of this.#misraRules) {
                rule.match(node, true);
            }
        }
        if (this.#context.errors.length > 0) {
            this.#context.printErrors();
        } else {
            console.log("No MISRA-C violations detected.");
        }
    } 

    public static applyCorrections(startingPoint: Program | FileJp = Query.root() as Program) {
        this.init(startingPoint);

        let iteration = 0;
        let modified = false;
        do {
            console.log(`Iteration #${++iteration}: Applying MISRA-C transformations...`);
            modified = this.transformAST(startingPoint);
        } while(modified);

        if (this.#context.errors.length === 0 && this.#context.warnings.length === 0) {
            console.log("All detected violations were corrected.");
        } else {
            if (this.#context.warnings.length > 0) {
                console.log("Warnings from automatic MISRA-C corrections (these may change the program's behavior):");
                this.#context.printWarnings();
            } 
            if (this.#context.errors.length > 0) {
                console.log("Remaining MISRA-C violations:");
                this.#context.printErrors();
            } 
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

        let child = $jp.children[0];
        while (child) {
            if (this.transformAST(child)) 
                modified = true;
            child = child.rightJp;
        }
        return modified;
    }

    public static getMISRAErrors(): MISRAError[] {
        return this.#context.errors;
    }
}