import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "./MISRARule.js";
import misraRules from "./rules/index.js";
import MISRAContext from "./MISRAContext.js";
import MISRAError from "./MISRAError.js";

export default class MISRATool {
    #misraRules: MISRARule[];
    #context: MISRAContext;

    //TODO: [optional] specify rules 
    constructor() {
        console.log("hello")
        this.#context = new MISRAContext();
        this.#misraRules = misraRules(this.#context);
    }

    public checkCompliance() {
        const nodes = (Query.root() as Program).descendants;

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

    public applyCorrections() {
        let iteration = 0;
        let modified = false;

        do {
            iteration++;
            console.log(`Iteration #${iteration}: Applying MISRA-C transformations...`);

            modified = this.transformAST(Query.root() as Program);
        } while(modified);

        if (this.#context.errors.length > 0) {
            console.log("Remaining MISRA-C violations:");
            this.#context.printErrors();
        } else {
            console.log("All detected violations were corrected.");
        }
    }

    public getMISRAErrors(): MISRAError[] {
        return this.#context.errors;
    }

    private transformAST($jp: Joinpoint): boolean {
        let modified = false;

        for (const rule of this.#misraRules) {
            if (rule.transform($jp)) 
                modified = true;
                break;
        }

        for (const child of $jp.children) {
            if(this.transformAST(child)) 
                modified = true;
        }
        return modified;
    }
}