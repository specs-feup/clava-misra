import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Call, FileJp, Include, Joinpoint, Program } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export default class Section21_StandardLibraries extends MISRAAnalyser {
    ruleMapper: Map<string, (jp: FileJp | Program) => void>;

    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["21.3", this.r21_3_noDynamicAllocation.bind(this)],
            ["21.4", this.r21_4_noSetjmpUsage.bind(this)],
            ["21.5", this.r21_5_noSignalUsage.bind(this)],
            ["21.6", this.r21_6_noStandardIO.bind(this)],
            ["21.7", this.r21_7_noStringFunctions.bind(this)],
            ["21.8", this.r21_8_noSysFunctions.bind(this)],
            ["21.9", this.r21_9_noStdAlgos.bind(this)],
            ["21.10", this.r21_10_noDateUsage.bind(this)],
            ["21.11", this.r21_11_noTgmathUsage.bind(this)],
            ["21.12", this.r21_12_noFenvExceptions.bind(this)]
        ]);
    }
    
    private r21_3_noDynamicAllocation($startNode: Joinpoint) {
        const calls = Query.searchFrom($startNode, Call, {name: /(malloc|realloc|calloc|free)/}).get();
        for (const call of calls) {
            this.logMISRAError(this.currentRule, call, "Use of memory allocation functions provided by <stdlib.h> is not allowed.");
        }
    }
    
    private r21_4_noSetjmpUsage($startNode: Joinpoint) {
        const includes = Query.searchFrom($startNode, Include, {name: "setjmp.h", isAngled: true}).get();
        for (const include of includes) {
            this.logMISRAError(this.currentRule, include, "Use of <setjmp.h> is not allowed.");
        }
    }
    
    private r21_5_noSignalUsage($startNode: Joinpoint) {
        const includes = Query.searchFrom($startNode, Include, {name: "signal.h", isAngled: true}).get();
        for (const include of includes) {
            this.logMISRAError(this.currentRule, include, "Use of <signal.h> is not allowed.");
        }
    }
    
    private r21_6_noStandardIO($startNode: Joinpoint) {
        const includes = Query.searchFrom($startNode, Include, {name: /(stdio.h|wchar.h)/}).get();
        for (const include of includes) {
            this.logMISRAError(this.currentRule, include, "Use of the standard library I/O functions provided by <stdio.h> and <wchar.h> is not allowed.");
        }
    }
    
    private r21_7_noStringFunctions($startNode: Joinpoint) {
        const calls = Query.searchFrom($startNode, Call, {name: /(atoi|atof|atol|atoll)/}).get();
        for (const call of calls) {
            this.logMISRAError(this.currentRule, call, `Use of function ${call.signature} is not allowed.`);
        }
    }
    
    private r21_8_noSysFunctions($startNode: Joinpoint) {
        const calls = Query.searchFrom($startNode, Call, {name: /(system|abort|exit|getenv)/}).get();
        for (const call of calls) {
            this.logMISRAError(this.currentRule, call, `Use of function ${call.signature} is not allowed.`);
        }
    }
    
    private r21_9_noStdAlgos($startNode: Joinpoint) {
        const calls = Query.searchFrom($startNode, Call, {name: /(qsort|bsearch)/}).get();
        for (const call of calls) {
            this.logMISRAError(this.currentRule, call, `Use of function ${call.signature} is not allowed.`);
        }
    }
    
    private r21_10_noDateUsage($startNode: Joinpoint) {
        const includes = Query.searchFrom($startNode, Include, {name: "time.h", isAngled: true}).get();
        for (const include of includes) {
            this.logMISRAError(this.currentRule, include, "Use of <time.h> is not allowed.");
        }
        const calls = Query.searchFrom($startNode, Call, {name: "wcsftime"}).get();
        for (const call of calls) {
            this.logMISRAError(this.currentRule, call, "Identifier 'wcsftime' shall not be used.");
        }
    }
    
    private r21_11_noTgmathUsage($startNode: Joinpoint) {
        const includes = Query.searchFrom($startNode, Include, {name: "tgmath.h", isAngled: true}).get();
        for (const include of includes) {
            this.logMISRAError(this.currentRule, include, "Use of <tgmath.h> is not allowed.");
        }
    }
    
    private r21_12_noFenvExceptions($startNode: Joinpoint) {
        const calls = Query.searchFrom($startNode, Call, {name: /(feclearexcept|fegetexceptflag|feraiseexcept|fesetexceptflag|fetestexcept)/}).get();
        for (const call of calls) {
            this.logMISRAError(this.currentRule, call, `Use of function ${call.signature} is not allowed.`);
        }
    }
    
    
}