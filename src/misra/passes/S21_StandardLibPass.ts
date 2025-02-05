import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { Call, Include, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";

export default class S21_StandardLibPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];

    initRuleMapper(): void {
        this._ruleMapper = new Map([
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

    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof Call || $jp instanceof Include;
    }

    private r21_3_noDynamicAllocation($startNode: Joinpoint) {
        if (!($startNode instanceof Call && /(malloc|realloc|calloc|free)/.test($startNode.name))) return;

        this.logMISRAError("Use of memory allocation functions provided by <stdlib.h> is not allowed.");
    }

    private r21_4_noSetjmpUsage($startNode: Joinpoint) {
        if (!($startNode instanceof Include && $startNode.isAngled && $startNode.name === "setjmp.h")) return;

        this.logMISRAError("Use of <setjmp.h> is not allowed.");
    }
    
    private r21_5_noSignalUsage($startNode: Joinpoint) {
        if (!($startNode instanceof Include && $startNode.isAngled && $startNode.name === "signal.h")) return;

        this.logMISRAError("Use of <signal.h> is not allowed.");    
    }

    private r21_6_noStandardIO($startNode: Joinpoint) {
        if (!($startNode instanceof Include && $startNode.isAngled && /(stdio.h|wchar.h)/.test($startNode.name))) return;

        this.logMISRAError("Use of the standard library I/O functions provided by <stdio.h> and <wchar.h> is not allowed.");
    }

    private r21_7_noStringFunctions($startNode: Joinpoint) {
        if (!($startNode instanceof Call && /(atoi|atof|atol|atoll)/.test($startNode.name))) return;

        this.logMISRAError(`Use of function ${$startNode.signature} is not allowed.`);
    }

    private r21_8_noSysFunctions($startNode: Joinpoint) {
        if (!($startNode instanceof Call && /(system|abort|exit|getenv)/.test($startNode.name))) return;
        
        this.logMISRAError(`Use of function ${$startNode.signature} is not allowed.`);
    }

    private r21_9_noStdAlgos($startNode: Joinpoint) {
        if (!($startNode instanceof Call && /(qsort|bsearch)/.test($startNode.name))) return;
        
        this.logMISRAError(`Use of function ${$startNode.signature} is not allowed.`);
    }

    private r21_10_noDateUsage($startNode: Joinpoint) {
        if ($startNode instanceof Include && $startNode.isAngled && $startNode.name === "time.h") {
            this.logMISRAError("Use of <time.h> is not allowed.");
        }
        else if ($startNode instanceof Call && $startNode.name === "wcsftime") {
            this.logMISRAError("Identifier 'wcsftime' shall not be used.");
        }
    }
    
    private r21_11_noTgmathUsage($startNode: Joinpoint) {
        if (!($startNode instanceof Include && $startNode.isAngled && $startNode.name === "tgmath.h")) return;

        this.logMISRAError("Use of <tgmath.h> is not allowed."); 
    }

    private r21_12_noFenvExceptions($startNode: Joinpoint) {
        if (!($startNode instanceof Call && /(feclearexcept|fegetexceptflag|feraiseexcept|fesetexceptflag|fetestexcept)/.test($startNode.name))) return;
        
        this.logMISRAError(`Use of function ${$startNode.signature} is not allowed.`);
    }

    protected _name: string = "Standard libraries";
}