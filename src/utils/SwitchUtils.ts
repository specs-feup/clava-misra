import { BinaryOp, Break, BuiltinType, Case, Joinpoint, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { hasDefinedType } from "./JoinpointUtils.js";

/**
 * Retrieves the last statement of the given case
 * @param $jp - The case to retrieve the last statement from
 * @returns The last statement of the case or undefined if there are no statements or it has a consecutive case.
 */
export function getLastStmtOfCase($jp: Case): Joinpoint | undefined {
    if ($jp.instructions.length === 0) { // Has a consecutive case
        return undefined;
    }

    let caseScopeStmts: Joinpoint[] = [];
    for (const stmt of $jp.siblingsRight) {
        if (stmt instanceof Case) {
            break;
        }
        caseScopeStmts.push(stmt);
    }
    return !caseScopeStmts.some(stmt => stmt instanceof Break) ? 
                caseScopeStmts[caseScopeStmts.length - 1] : 
                caseScopeStmts.find(stmt => stmt instanceof Break);
} 

/**
 * Retrieves the number of switch clauses with instructions in the provided switch statement
 * @param $jp - The switch statement to analyze
 * @returns The number of switch clauses with instructions
 */
export function countSwitchClauses($jp: Switch): number  {
    let firstStatements = []

    for (const caseLabel of $jp.cases) {
        if (caseLabel.instructions.length === 0) { // Has a consecutive case
            continue;
        }
        firstStatements.push(caseLabel.instructions[0])
    }
    return firstStatements.length;
} 

/**
 * Checks if the provided switch statement has a Boolean condition
 * @param switchStmt The switch statement to check
 * @returns Returns true if the switch statement has a Boolean condition, otherwise false
 */
export function switchHasBooleanCondition(switchStmt: Switch): boolean {
    return switchStmt.condition instanceof BinaryOp ||
            (hasDefinedType(switchStmt.condition) &&
             switchStmt.condition.type instanceof BuiltinType &&
              switchStmt.condition.type.builtinKind === "Bool"
            );
}

/**
 * Checks if the provided switch statement contains any conditional break
 * 
 * @param switchStmt - The switch statement to analyze
 * @returns Returns true if the switch statement contains a conditional break, otherwise false
 */
export function switchHasConditionalBreak(switchStmt: Switch): boolean {
    return Query.searchFrom(switchStmt, Break, { currentRegion: region => region.astId !== switchStmt.astId, enclosingStmt: jp => jp.astId === switchStmt.astId }).get().length > 0;
}