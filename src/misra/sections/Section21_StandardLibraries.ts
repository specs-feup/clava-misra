import Query from "lara-js/api/weaver/Query.js";
import { Call, FileJp, Include, Joinpoint, Program } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export default class Section21_StandardLibraries extends MISRAAnalyser {
    ruleMapper: Map<number, (jp: FileJp | Program) => void>;

    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [3, this.r21_3_noDynamicAllocation.bind(this)],
            [4, this.r21_4_noSetjmpUsage.bind(this)],
            [5, this.r21_5_noSignalUsage.bind(this)],
            [6, this.r21_6_noStandardIO.bind(this)],
            [7, this.r21_7_noStringFunctions.bind(this)],
            [8, this.r21_8_noSysFunctions.bind(this)],
            [9, this.r21_9_noStdAlgos.bind(this)],
            [10, this.r21_10_noDateUsage.bind(this)],
            [11, this.r21_11_noTgmathUsage.bind(this)],
            [12, this.r21_12_noFenvExceptions.bind(this)]
        ]);
    }

    private r21_3_noDynamicAllocation($startNode: Joinpoint) {
        Query.searchFrom($startNode, Call, {name: /(malloc|realloc|calloc|free)/}).get().forEach(call => this.logMISRAError(call, "Use of memory allocation functions provided by <stdlib.h> is not allowed."), this);
    }

    private r21_4_noSetjmpUsage($startNode: Joinpoint) {
        Query.searchFrom($startNode, Include, {name: "setjmp.h", isAngled: true}).get().forEach(include => this.logMISRAError(include, "Use of <setjmp.h> is not allowed."), this);
    }
    
    private r21_5_noSignalUsage($startNode: Joinpoint) {
        Query.searchFrom($startNode, Include, {name: "signal.h", isAngled: true}).get().forEach(include => this.logMISRAError(include, "Use of <setjmp.h> is not allowed."), this);
    }

    private r21_6_noStandardIO($startNode: Joinpoint) {
        Query.searchFrom($startNode, Include, {name: /(stdio.h|wchar.h)/}).get().forEach(include => this.logMISRAError(include, "Use of the standard library I/O functions provided by <stdio.h> and <wchar.h> is not allowed."), this);
    }

    //how to avoid triggering errors for functions with the same name?
    private r21_7_noStringFunctions($startNode: Joinpoint) {
        Query.searchFrom($startNode, Call, {name: /(atoi|atof|atol|atoll)/}).get().forEach(call => this.logMISRAError(call, `Use of function ${call.signature} is not allowed.`), this);
    }

    private r21_8_noSysFunctions($startNode: Joinpoint) {
        Query.searchFrom($startNode, Call, {name: /(system|abort|exit|getenv)/}).get().forEach(call => this.logMISRAError(call, `Use of function ${call.signature} is not allowed.`), this);
    }

    private r21_9_noStdAlgos($startNode: Joinpoint) {
        Query.searchFrom($startNode, Call, {name: /(qsort|bsearch)/}).get().forEach(call => this.logMISRAError(call, `Use of function ${call.signature} is not allowed.`), this);
    }

    private r21_10_noDateUsage($startNode: Joinpoint) {
        Query.searchFrom($startNode, Include, {name: "time.h", isAngled: true}).get().forEach(include => this.logMISRAError(include, "Use of <time.h> is not allowed."), this);
        Query.searchFrom($startNode, Call, {name: "wcsftime"}).get().forEach(call => this.logMISRAError(call, "Identifier 'wcsftime' shall not be used."), this);
    }
    
    private r21_11_noTgmathUsage($startNode: Joinpoint) {
        Query.searchFrom($startNode, Include, {name: "tgmath.h", isAngled: true}).get().forEach(include => this.logMISRAError(include, "Use of <tgmath.h> is not allowed."), this);
    }

    private r21_12_noFenvExceptions($startNode: Joinpoint) {
        Query.searchFrom($startNode, Call, {name : /(feclearexcept|fegetexceptflag|feraiseexcept|fesetexceptflag|fetestexcept)/}).get().forEach(call => this.logMISRAError(call, `Use of function ${call.signature} is not allowed`), this);
    }
}