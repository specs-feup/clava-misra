import { Body, BuiltinType, FileJp, FunctionJp, Joinpoint, ReturnStmt } from "@specs-feup/clava/api/Joinpoints.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import { AnalysisType, MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";
import { isValidFile } from "../../utils/FileUtils.js";
import UserConfigurableRule from "../UserConfigurableRule.js";
import ClavaNode from "@specs-feup/clava-flow/ClavaNode";
import ReturnNode from "@specs-feup/clava-flow/cfg/node/ReturnNode";
import ClavaCfgGenerator from "@specs-feup/clava-flow/transformation/ClavaCfgGenerator";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import Graph from "@specs-feup/flow/graph/Graph";

/**
* MISRA Rule 17.4: All exit paths from a function with non-void return type shall have an explicit return statement with an expression. In a non-void function:
*   - Every return statement has an expression, and 
*   - Control cannot reach the end of the function without encountering a return statement
 */
export default class Rule_17_4_NonVoidReturn extends UserConfigurableRule {
    readonly analysisType = AnalysisType.SINGLE_TRANSLATION_UNIT;

    override get name(): string {
        return "17.4";
    }

    /**
     * Checks if the given joinpoint represents a non-void function that lacks an explicit return statement with an expression.
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the rule, false otherwise
     */
    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        if (!($jp instanceof FunctionJp && $jp.isImplementation)) return false;
        if ($jp.returnType instanceof BuiltinType && $jp.returnType.isVoid) return false;
        if ($jp.body.children.some(childJp => childJp instanceof ReturnStmt)) return false;
        
        const nonCompliant = !this.allControlPathsReturn($jp);

        if (logErrors && nonCompliant) {
            this.logMISRAError($jp, `Function '${$jp.name}' reaches the end without a return statement.`)
        }
        return nonCompliant;
    }

    /**
     * Performs a depth.first search on the function's control flow graph (CFG) to check if all exit paths in the function have a return statement
     * 
     * @param functionJp  The function to analyze
     * @returns Returns true if all exit paths in the function have an explicit return statement, otherwise returns false.
     */
    private allControlPathsReturn(functionJp: FunctionJp) {
        const cfg = Graph.create().apply(new ClavaCfgGenerator(functionJp));
        const startNode: BaseNode.Class = cfg.nodes.filterIs(ClavaNode).filter(node => node.jp instanceof Body)[0];
        const stack = [startNode];
        const visited = new Set();
    
        while (stack.length > 0) {
            const node = stack.pop()!;
    
            if (visited.has(node) || node?.is(ReturnNode)) 
                continue;
            
            let children = Array.from(node.outgoers).map(edge => edge.target);
            if (!children || children.length === 0)  
                return false; // Reached the end of the graph without finding a single return statement
    
            children = children.filter(child => !visited.has(child));
            children.forEach(child => stack.push(child.as(BaseNode)));
        }
        return true; 
    }

    /**
     * Transforms a non-void function joinpoint that has no return statement at the end, by adding a default return value based on the config file.
     * - If the configuration file is missing/invalid or the specified default value is invalid, no transformation is performed and the function is left unchanged.
     * - Otherwise, a return statement is inserted as the last statement of the function. 
     * 
     * @param $jp - Joinpoint to transform
     * @returns Report detailing the transformation result
     */
    apply($jp: Joinpoint): MISRATransformationReport {
        const previousResult = $jp instanceof FunctionJp ? this.context.getRuleResult(this.ruleID, $jp) : undefined;
        if (previousResult === MISRATransformationType.NoChange || !this.match($jp)) {
            return new MISRATransformationReport(MISRATransformationType.NoChange);   
        }

        const functionJp = $jp as FunctionJp;
        const fileJp = functionJp.getAncestor("file") as FileJp;
        const errorMsgPrefix = this.getErrorMsgPrefix(functionJp);

        const defaultValueReturn = this.getFixFromConfig(functionJp);
        if (defaultValueReturn === undefined) {
            this.context.addRuleResult(this.ruleID, $jp, MISRATransformationType.NoChange);
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        }

        // Insert return statement and validate it
        const returnStmt = ClavaJoinPoints.returnStmt(ClavaJoinPoints.exprLiteral(String(defaultValueReturn), functionJp.returnType)) as ReturnStmt;
        functionJp.body.lastChild ? functionJp.body.lastChild.insertAfter(returnStmt) : functionJp.body.setFirstChild(returnStmt);

        // Validate the provided default value
        if (isValidFile(fileJp)) {
            return new MISRATransformationReport(MISRATransformationType.DescendantChange);
        } 

        // If the default value is invalid, the return stmt is removed
        returnStmt.detach();
        this.logMISRAError($jp, `${errorMsgPrefix} Provided default value for type '${functionJp.type.code}' is invalid and was therefore not inserted.`);
        this.context.addRuleResult(this.ruleID, $jp, MISRATransformationType.NoChange);
        return new MISRATransformationReport(MISRATransformationType.NoChange);
    }

    getErrorMsgPrefix(functionJp: FunctionJp): string {
        return `Function '${functionJp.name}' reaches the end without a return statement.`;
    }

    getFixFromConfig(functionJp: FunctionJp): string | undefined {
        const errorMsgPrefix = this.getErrorMsgPrefix(functionJp);

        if (!this.context.config) {
            this.logMISRAError(functionJp, `${errorMsgPrefix} Default value return not added due to missing config file.`)
            return undefined;
        }

        let defaultValueReturn: string | undefined = undefined;
        const returnType = functionJp.type.code;
        try {
            defaultValueReturn = this.context.config.get("defaultValues")[returnType];
        } catch (error) {  
            this.logMISRAError(functionJp, `${errorMsgPrefix} Default value return was not added as \'defaultValues\' is not defined in the configuration file.`);
            return undefined;
        }

        if (defaultValueReturn === undefined) {
            this.logMISRAError(functionJp, `${errorMsgPrefix} Default value return not added due to missing default value configuration for type '${returnType}'.`);
        }
        return defaultValueReturn;
    }
}
