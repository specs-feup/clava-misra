import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Program, FileJp, IntLiteral, Type, PointerType, QualType, Vardecl, BinaryOp, ReturnStmt, FunctionJp, Call, Varref, ArrayAccess, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export default class Section7_LiteralsConstants extends MISRAAnalyser {
    ruleMapper: Map<string, (jp: Program | FileJp) => void>;

    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["7.1", this.r7_1_noOctalConstants.bind(this)],
            ["7.3", this.r7_3_noLowercaseLSuffix.bind(this)],
            ["7.4", this.r7_4_constStringLiterals.bind(this)]
        ]);
    }
    
    private r7_1_noOctalConstants($startNode: Joinpoint) {
        for (const intLit of Query.searchFrom($startNode, IntLiteral)) {
            if (intLit.code.match(/0[0-9]+/g)) {
                this.logMISRAError(this.currentRule, intLit, `The octal constant ${intLit.code} was used. Its decimal value is ${intLit.value}`);
            }
        }
    }
    
    private r7_3_noLowercaseLSuffix($startNode: Joinpoint) {
        for (const intLit of Query.searchFrom($startNode, IntLiteral)) {
            if (intLit.code.includes('l')) {
                this.logMISRAError(this.currentRule, intLit, `A lowercase 'l' was used as a suffix in ${intLit.code}.`);
            }
        }
    }
    
    private static checkPointerConst(type: Type) {
        if (type instanceof PointerType) {
            return type.pointee.constant;
        }
        else if (type instanceof QualType && type.unqualifiedType instanceof PointerType) {
            return type.unqualifiedType.pointee.constant;
        }
        else return undefined;
    }
    
    private r7_4_constStringLiterals($startNode: Joinpoint) { 
        for (const varDecl of Query.searchFrom($startNode, Vardecl)) {
            if (!varDecl.type.isPointer) continue;
    
            if (varDecl.children.length > 0 && varDecl.children[0].joinPointType === "literal"
                && !Section7_LiteralsConstants.checkPointerConst(varDecl.type)) {
                    this.logMISRAError(this.currentRule, varDecl, `String literal assigned to non-const qualified variable ${varDecl.name}`);
            }
        }
        
        Query.searchFrom($startNode, BinaryOp, {isAssignment: true}).get().forEach(bOp => {
            if (bOp.right.joinPointType === "literal" && !Section7_LiteralsConstants.checkPointerConst(bOp.left.type)) {
                this.logMISRAError(this.currentRule, bOp, `String literal assigned to non-const qualified variable ${(bOp.left as Varref | ArrayAccess).name}`);
            }
        }, this);
    
        for (const ret of Query.searchFrom($startNode, ReturnStmt)) {
            const ancestor = ret.getAncestor("function") as FunctionJp;
            const retType = ancestor.functionType.returnType;
            if (ret.returnExpr?.joinPointType === "literal" && !Section7_LiteralsConstants.checkPointerConst(retType)) {
                this.logMISRAError(this.currentRule, ret, `String literal returned in non-const qualified return value for function ${ancestor.name}`);
            }
        }
    
        for (const call of Query.searchFrom($startNode, Call)) {
            const paramTypes = call.function.functionType.paramTypes;
            for (let i = 1; i < call.children.length; i++) {
                if (call.children[i].joinPointType === "literal" && !Section7_LiteralsConstants.checkPointerConst(paramTypes[i-1])) {
                    this.logMISRAError(this.currentRule, call.children[i], `String literal passed as non-const qualified parameter in call of ${call.function.name}`);
                }
            }
        }
    }
}