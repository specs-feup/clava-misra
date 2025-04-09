import Fix from "@specs-feup/clava/api/clava/analysis/Fix.js";
import PassResult from "@specs-feup/lara/api/lara/pass/results/PassResult.js";

export interface MISRAReport {
    rule: number,
    message: string,
    fix?: Fix
}

export default class MISRAPassResult extends PassResult {
    protected _reports: MISRAReport[] = [];

    get reports(): MISRAReport[] {
        return this._reports;
    }

    addReport($report: MISRAReport) {
        this._reports.push($report);
    }
}