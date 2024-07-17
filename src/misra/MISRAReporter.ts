import { Decl, FunctionJp } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser from "./MISRAAnalyser.js";

export interface MISRAPreprocessing {
    externalObjects?: Array<FunctionJp | Decl>;
}

export enum MISRAPreprocessingReqs {
    EXTERNAL_OBJECTS
}

export default class MISRAReporter {
    #analysers: MISRAAnalyser[];
    #preprocessing: MISRAPreprocessing = {};

    constructor(analysers: MISRAAnalyser[]) {
        this.#analysers = analysers;
    }

    private updateReqs(reqs: MISRAPreprocessingReqs[]) {
        for (const req of reqs) {
            switch (req) {
                case MISRAPreprocessingReqs.EXTERNAL_OBJECTS:
                    if (!this.#preprocessing.externalObjects) {
                        //call to get all declarations of external objects
                    } 
                    break;
            }
        }
    }

    generateReport() {
        for (const analyser of this.#analysers) {
            const reqs = [MISRAPreprocessingReqs.EXTERNAL_OBJECTS]; //get reqs from analyser
            this.updateReqs(reqs);
            analyser.analyse(this.#preprocessing);
        }
    }
}