import { Joinpoint } from "clava-js/api/Joinpoints.js";
import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint.js";
import SimplePass from "lara-js/api/lara/pass/SimplePass.js";
import PassResult from "lara-js/api/lara/pass/results/PassResult.js";

export default abstract class MISRAPass extends SimplePass {
    protected _ruleMapper: Map<number, ($jp: Joinpoint) => void> = new Map();
    private _executedRules: Map<number, boolean> = new Map();
    private _rules: number[];

    abstract initRuleMapper(): void;

    private resetRules(): void {
        this._executedRules.forEach(($value: boolean, $key: number) => {
            this._executedRules.set($key, false);
        }, this);
    }

    constructor(includeDescendants: boolean = true, rules: number[]) {
        super(includeDescendants);
        this._rules = rules;
        this.initRuleMapper();

        this._ruleMapper.forEach(($value: ($jp: Joinpoint) => void, $key: number) => {
            this._executedRules.set($key, false);
        }, this);
    }

    private executeRule($id: number, $jp: Joinpoint) {
        if (!this._ruleMapper.has($id)) {
            throw new Error(`Pass does not support rule ${$id}`);
        }

        (this._ruleMapper.get($id) as ($jp: Joinpoint) => void)($jp);
        this._executedRules.set($id, true);
    }

    private dependsOn($id: number, $jp: Joinpoint) {
        if (this._executedRules.get($id) === false) {
            this.executeRule($id, $jp);
        }
    }

    abstract matchJoinpoint($jp: LaraJoinPoint): boolean;

    transformJoinpoint($jp: LaraJoinPoint): PassResult {
        this.resetRules();
        this._rules.forEach($id => this.executeRule($id, $jp as Joinpoint), this);

        return new PassResult(this, $jp);
    }

    protected abstract _name: string;
    
}