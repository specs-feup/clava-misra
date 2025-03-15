import { BinaryOp, Break, Case, Expression, If, Joinpoint, Scope, Statement, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import { getNumOfSwitchClauses } from "./utils.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

export enum MISRATransformationType {
    NoChange,
    DescendantChange,
    Replacement,
    Removal
}

/**
 * Represents an error in MISRA compliance, including the rule ID, the joinpoint where the violation occurred, and a descriptive message.
 */
export class MISRAError {
    /**
     * Represents the specific MISRA rule that was violated
     */
    public ruleID: string;
    /**
     * The joinpoint where the error was detected
     */
    public $jp: Joinpoint;
    /**
     * Explanation of the violation
     */
    public message: string;

    /**
     * 
     * @param ruleID - specific MISRA rule that was violated
     * @param $jp - joinpoint where the error was detected
     * @param message - description of the error
     */
    constructor(ruleID: string, $jp: Joinpoint, message: string) {
        this.ruleID = ruleID;
        this.$jp = $jp;
        this.message =  message;
    }

    /**
     * Checks if two instances of MISRAError are equal based on all properties
     * @param other 
     * @returns - `true` if the errors are the same, `false` otherwise.
     */
    equals(other: MISRAError): boolean {
        return this.ruleID === other.ruleID &&
               this.$jp === other.$jp &&
               this.message === other.message;
    }
}

/**
 * A report of a MISRA transformation, including the transformation type and an optional new joinpoint node.
 * 
 * If the transformation type is `Replacement`, the `newNode` must be provided to indicate the new joinpoint.
 */
export class MISRATransformationReport {
    /**
     * The type of the MISRA transformation
     */
    type: MISRATransformationType;
    /**
     * An optional new joinpoint node, provided if the transformation involves a replacement
     */
    newNode?: Joinpoint; 

    /**
     * 
     * @param type The type of the MISRA transformation
     * @param newNode The new joinpoint node resulting from the transformation. Required if the transformation type is `Replacement`.
     */
    constructor(type: MISRATransformationType, newNode?: Joinpoint) {
        this.type = type;
        if (type === MISRATransformationType.Replacement && !newNode) {
            throw new Error("newNode must be provided when a 'Replacement' transformation is performed");
        }
        this.newNode = newNode;
    }
}

/**
 * Converts a switch statement into either consecutive statements or if statements
 * - If the switch has only one clause and a default case, it is converted to consecutive statements.
 * - Otherwise, it is converted to if statements.
 */
export class MISRASwitchConverter {
    /**
     * Converts a switch statement to consecutive statements or if statements
     * 
     * @param switchStmt - The switch statement to convert
     * @returns The converted statements or `undefined` if no statements remain
     */
    static convert(switchStmt: Switch): Statement | undefined {
        if (switchStmt.hasDefaultCase && getNumOfSwitchClauses(switchStmt) < 2) {  // The statements will always be executed 
            return this.convertToConsecutiveStmts(switchStmt);
        } else {
            return this.convertToIfStatements(switchStmt);
        }
    }

    /**
     * Converts a switch with only one clause and a default case into consecutive statements
     * 
     * @param switchStmt - The switch statement to convert
     * @returns The first statement or `undefined` if no statements remain
     */
    static convertToConsecutiveStmts(switchStmt: Switch): Statement | undefined {
        const scope = switchStmt.children[1] as Scope;
        this.removeBreakStmts(scope);
        this.removeCases(scope);

        // If there are no statements except break, the switch can be removed
        if (scope.children.length === 0) {
            switchStmt.detach();
            return undefined;
        }

        let firstStmt, lastStmt;
        const stmts = scope.children as Statement[];
        for (let i = 0; i < stmts.length; i++) {
            const stmt = stmts[i];
            stmt.detach();

            if (!firstStmt) {
                firstStmt = stmt;
                switchStmt.replaceWith(firstStmt);
                lastStmt = stmt;
                continue;
            }
            lastStmt!.insertAfter(stmt);
            lastStmt = stmt;
        }
        return firstStmt as Statement;
    }

    /**
     * Converts a switch statement into a series of if statements
     * 
     * @param switchStmt - The switch statement to convert
     * @returns - The first if statement created
     */
    static convertToIfStatements(switchStmt: Switch): If {
        const scope = switchStmt.children[1] as Scope;
        const consecutiveCases = this.consecutiveCases(switchStmt);
        this.removeBreakStmts(scope);

        let ifStmt: If;
        let lastIfStmt: If | undefined;
        for (let i = 0; i < consecutiveCases.length; i++) {
            const cases = consecutiveCases[i];

            if (cases.some(caseStmt => caseStmt.isDefault)) { // Has default case
                lastIfStmt!.setElse(ClavaJoinPoints.scope(...cases[cases.length-1].instructions));
            } else {
                lastIfStmt = this.createIfStatement(switchStmt.condition, cases, i, lastIfStmt)
                if (i === 0) {
                    ifStmt = lastIfStmt;
                }
            }
        }
        switchStmt.replaceWith(ifStmt!);
        return ifStmt!;
    }

    /**
     * Creates an if statement for the given consecutive cases
     * 
     * @param condition - The switch condition
     * @param cases - A list of consecutive cases
     * @param index - The index of the current case group
     * @param lastIfStmt - The last if statement, used to chain else
     * @returns - The new if statement
     */
    private static createIfStatement(condition: Expression, cases: Case[], index: number, lastIfStmt: If | undefined): If {
        const conditionExpr = this.equivalentCondition(condition, cases);
        const thenBody = ClavaJoinPoints.scope(...cases[cases.length - 1].instructions);
        const newIfStmt = ClavaJoinPoints.ifStmt(conditionExpr, thenBody);

        if (index === 0) {
            return newIfStmt;
        } else {
            lastIfStmt!.setElse(newIfStmt);
            return newIfStmt;
        }
    }

    /**
     * Creates the equivalent condition for an if statement based on the case values
     * 
     * @param condition - The switch condition
     * @param cases - A list of case` statements
     * @returns - The combined condition
     */
    private static equivalentCondition(condition: Expression, cases: Case[]): Expression {
        let lastBinaryOp: BinaryOp;

        for (let i = 0; i < cases.length; i++) {
            const caseStmt = cases[i];
            const newBinaryOp = ClavaJoinPoints.binaryOp("==", condition, caseStmt.values[0]);
            
            if (i === 0) {
                lastBinaryOp = newBinaryOp;
                continue;
            } 
            lastBinaryOp = ClavaJoinPoints.binaryOp("||", lastBinaryOp!, newBinaryOp);
        }
        return lastBinaryOp!;
    }

    /**
     * Removes all break statements from the given scope
     * @param scope - The scope from which the break statements will be removed
     */
    private static removeBreakStmts(scope: Scope) {
        const breakStmts = scope.children.filter(child => child instanceof Break);
        breakStmts.forEach(stmt => stmt.detach());
    }

    /**
     * Removes all case statements from the given scope
     * @param scope - The scope from which the case statements will be removed
     */
    private static removeCases(scope: Scope) {
        const cases = scope.children.filter(child => child instanceof Case);
        cases.forEach(caseStmt => caseStmt.detach());
    }

    /**
     * Groups case statements into consecutive blocks, ensuring the block with the default case is last
     * 
     * @param switchStmt - The switch statement
     * @returns - The grouped case statements
     */
    private static consecutiveCases(switchStmt: Switch): Case[][] {
        let caseGroups: Case[][] = [];
        let currentList: Case[] = [];

        for (const caseStmt of switchStmt.cases) {
            currentList.push(caseStmt);

            if (caseStmt.instructions.length !== 0) { // Has no consecutive case
                caseGroups.push(currentList);
                currentList = [];
            } 
        }

        // Ensure the block containing the default case is placed at the last position
        return this.organizeCaseGroups(caseGroups); 
    }

    /**
     * Organizes case groups such that the group with default case is placed last.
     * 
     * @param caseGroups - The groups of case statements
     * @returns - The organized case groups
     */
    private static organizeCaseGroups(caseGroups: Case[][]): Case[][] {
        const nonDefaultGroups = caseGroups.filter(block => !block.some(caseStmt => caseStmt.isDefault));
        const defaultBlock = caseGroups.find(block => block.some(caseStmt => caseStmt.isDefault));
        if (defaultBlock) {
            nonDefaultGroups.push(defaultBlock);
        }
        return nonDefaultGroups;
    }
}
