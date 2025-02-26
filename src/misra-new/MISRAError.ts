import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";

export default class MISRAError {
    public ruleID: string;
    public $jp: Joinpoint;
    public message: string;

    constructor(ruleID: string, $jp: Joinpoint, message: string) {
        this.ruleID = ruleID;
        this.$jp = $jp;
        this.message =  message;
    }

    equals(other: MISRAError): boolean {
        return this.ruleID === other.ruleID &&
               this.$jp === other.$jp &&
               this.message === other.message;
    }
}
