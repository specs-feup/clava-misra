import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { ArrayAccess, BinaryOp, Call, FunctionJp, IntLiteral, Joinpoint, PointerType, QualType, ReturnStmt, Type, Vardecl, Varref } from "clava-js/api/Joinpoints.js";

export default class S7_LiteralsConstantsPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [1, this.r7_1_noOctalConstants.bind(this)],
            [3, this.r7_3_noLowercaseLSuffix.bind(this)],
            [4, this.r7_4_constStringLiterals.bind(this)]
        ]);
    }

    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof IntLiteral || $jp instanceof Vardecl || $jp instanceof BinaryOp || $jp instanceof ReturnStmt || $jp instanceof Call;
    }

    private r7_1_noOctalConstants($startNode: Joinpoint) {
        if (!($startNode instanceof IntLiteral)) return;

        if ($startNode.code.match(/0[0-9]+/g)) {
            this.logMISRAError(`The octal constant ${$startNode.code} was used. Its decimal value is ${$startNode.value}`);
        }
    }
    
    private r7_3_noLowercaseLSuffix($startNode: Joinpoint) {
        if (!($startNode instanceof IntLiteral)) return;

        if ($startNode.code.includes('l')) {
            this.logMISRAError(`A lowercase 'l' was used as a suffix in ${$startNode.code}.`);
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
        if ($startNode instanceof Vardecl) {
            if (!$startNode.type.isPointer) return;
    
            if ($startNode.children.length > 0 && $startNode.children[0].joinPointType === "literal"
                && !S7_LiteralsConstantsPass.checkPointerConst($startNode.type)) {
                    this.logMISRAError(`String literal assigned to non-const qualified variable ${$startNode.name}`);
            }
        }
        else if ($startNode instanceof BinaryOp && $startNode.isAssignment) {
            if ($startNode.right.joinPointType === "literal" && !S7_LiteralsConstantsPass.checkPointerConst($startNode.left.type)) {
                this.logMISRAError(`String literal assigned to non-const qualified variable ${($startNode.left as Varref | ArrayAccess).name}`);
            }
        }
        else if ($startNode instanceof ReturnStmt) {
            const ancestor = $startNode.getAncestor("function") as FunctionJp;
            const retType = ancestor.functionType.returnType;
            if ($startNode.returnExpr?.joinPointType === "literal" && !S7_LiteralsConstantsPass.checkPointerConst(retType)) {
                this.logMISRAError(`String literal returned in non-const qualified return value for function ${ancestor.name}`);
            }
        }
        else if ($startNode instanceof Call) {
            const paramTypes = $startNode.function.functionType.paramTypes;
            for (let i = 1; i < $startNode.children.length; i++) {
                if ($startNode.children[i].joinPointType === "literal" && !S7_LiteralsConstantsPass.checkPointerConst(paramTypes[i-1])) {
                    this.logMISRAError(`String literal passed as non-const qualified parameter in call of ${$startNode.function.name}`);
                }
            }
        }
    }

    protected _name: string = "Literals and constants";
    
}