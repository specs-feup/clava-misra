import { LaraJoinPoint } from "lara-js/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { BinaryOp, BuiltinType, Call, Cast, EnumType, Expression, FunctionJp, IntLiteral, Joinpoint, ParenExpr, QualType, ReturnStmt, TernaryOp, Type, UnaryOp } from "clava-js/api/Joinpoints.js";
import ClavaJoinPoints from "clava-js/api/clava/ClavaJoinPoints.js";
import Fix from "clava-js/api/clava/analysis/Fix.js";

export enum EssentialTypes {
    UNSIGNED = "unsigned",
    CHAR = "char",
    SIGNED = "signed",
    ENUM = "enum",
    FLOAT = "float",
    BOOL = "bool",
    UNKOWN = "unkown"
};

export interface EssentialType {
    category: EssentialTypes,
    enumName?: string
}

export default class S10_EssentialTypePass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [1, this.r10_1_appropriateEssentialOperands.bind(this)],
            [2, this.r10_2_appropriateCharOperands.bind(this)],
            [3, this.r10_3_noInvalidAssignments.bind(this)],
            [5, this.r10_5_noInvalidCasts.bind(this)],
            [6, this.r10_6_noWiderCompositeExprAssignments.bind(this)],
            [8, this.r10_8_noWiderCompositeCasts.bind(this)]
        ]);
    }

    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof Expression;
    }

    static getEssentialType(bType: Type): EssentialType {
        let type = bType.desugarAll;
        while (type instanceof QualType) {
            type = type.unqualifiedType.desugarAll;
        }

        if (type instanceof BuiltinType) {
            if (type.builtinKind === "Bool") {
                return {category: EssentialTypes.BOOL};
            }
            else if (type.builtinKind === "Char_S") {
                return {category: EssentialTypes.CHAR};
            }
            else if (type.isInteger && type.isSigned) {
                return {category: EssentialTypes.SIGNED};
            }
            else if (type.isInteger && !type.isSigned) {
                return {category: EssentialTypes.UNSIGNED};
            }
            else if (type.isFloat) {
                return {category: EssentialTypes.FLOAT};
            }
        }
        else if (type instanceof EnumType) {
            return type.name === "" ? {category: EssentialTypes.SIGNED} : {category: EssentialTypes.ENUM, enumName: type.name};
        }

        return {category: EssentialTypes.UNKOWN};
    }

    static isInteger($et: EssentialTypes): boolean {
        return $et === EssentialTypes.SIGNED || $et === EssentialTypes.UNSIGNED;
    }

    static getExprEssentialType($expr: Expression): EssentialType {
        if ($expr instanceof BinaryOp) {
            if ($expr.kind === "add") {
                if ((this.getExprEssentialType($expr.left).category === EssentialTypes.CHAR && this.isInteger(this.getExprEssentialType($expr.right).category))
                        || (this.getExprEssentialType($expr.right).category === EssentialTypes.CHAR && this.isInteger(this.getExprEssentialType($expr.left).category))) {
                    return {category: EssentialTypes.CHAR};
                }
            }
            else if ($expr.kind === "sub") {
                if (this.getExprEssentialType($expr.left).category === EssentialTypes.CHAR) {
                    if (this.getExprEssentialType($expr.right).category === EssentialTypes.CHAR) {
                        return {category: EssentialTypes.CHAR};
                    }
                }
            }
        }
        return this.getEssentialType($expr.type);
    }

    private restrictOperand($expr: Expression, $restrictedType: EssentialTypes, $baseExpr: Expression, $castTo?: BuiltinType) {
        const et = S10_EssentialTypePass.getExprEssentialType($expr);
        if (et.category === $restrictedType) {
            const fix = $castTo ? new Fix($expr, ($jp) => {
                $jp.replaceWith(ClavaJoinPoints.cStyleCast($castTo, $jp as Expression));
            }) : undefined;
            this.logMISRAError(`Operand ${$expr.code} of expression ${$baseExpr.code} must not have essentially ${et.category} type.`, fix);
        }
    }

    private restrictOperandList($expr: Expression, $restrictedTypes: EssentialTypes[], $baseExpr: Expression, $castTo?: BuiltinType) {
        for (const type of $restrictedTypes) {
            this.restrictOperand($expr, type, $baseExpr, $castTo);
        }
    }

    private r10_1_appropriateEssentialOperands($startNode: Joinpoint) { //missing exception and compound operators
        if ($startNode instanceof TernaryOp) {
            this.restrictOperandList($startNode.cond, [EssentialTypes.CHAR, EssentialTypes.ENUM, EssentialTypes.FLOAT, EssentialTypes.SIGNED, EssentialTypes.UNSIGNED], $startNode);
        }
        else if ($startNode instanceof BinaryOp) {
            switch ($startNode.kind) {
                case "shl":
                case "shr":
                    if (!($startNode.right instanceof IntLiteral)) this.restrictOperand($startNode.right, EssentialTypes.SIGNED, $startNode);
                case "and":
                case "or":
                case "x_or":
                    this.restrictOperand($startNode.left, EssentialTypes.SIGNED, $startNode);
                    if ($startNode.kind !== "shl" && $startNode.kind !== "shr") this.restrictOperand($startNode.right, EssentialTypes.SIGNED, $startNode);
                case "rem":
                    this.restrictOperand($startNode.left, EssentialTypes.FLOAT, $startNode);
                    this.restrictOperand($startNode.right, EssentialTypes.FLOAT, $startNode);
                case "mul":
                case "div":
                    this.restrictOperand($startNode.left, EssentialTypes.CHAR, $startNode);
                    this.restrictOperand($startNode.right, EssentialTypes.CHAR, $startNode);
                case "add":
                case "sub":
                    this.restrictOperand($startNode.left, EssentialTypes.ENUM, $startNode);
                    this.restrictOperand($startNode.right, EssentialTypes.ENUM, $startNode);
                case "le":
                case "ge":
                case "lt":
                case "gt":
                    this.restrictOperand($startNode.left, EssentialTypes.BOOL, $startNode);
                    this.restrictOperand($startNode.right, EssentialTypes.BOOL, $startNode);
                    break;
                case "l_and":
                case "l_or":
                    this.restrictOperandList($startNode.left, [EssentialTypes.ENUM, EssentialTypes.CHAR, EssentialTypes.SIGNED, EssentialTypes.UNSIGNED, EssentialTypes.FLOAT], $startNode);
                    this.restrictOperandList($startNode.right, [EssentialTypes.ENUM, EssentialTypes.CHAR, EssentialTypes.SIGNED, EssentialTypes.UNSIGNED, EssentialTypes.FLOAT], $startNode);
                    break;
            }
        }
        else if ($startNode instanceof UnaryOp) {
            switch ($startNode.kind) {
                case "minus":
                    this.restrictOperand($startNode.operand, EssentialTypes.UNSIGNED, $startNode);
                case "plus":
                    this.restrictOperandList($startNode.operand, [EssentialTypes.BOOL, EssentialTypes.CHAR, EssentialTypes.ENUM], $startNode);
                    break;
                case "l_not":
                    this.restrictOperandList($startNode.operand, [EssentialTypes.ENUM, EssentialTypes.CHAR, EssentialTypes.SIGNED, EssentialTypes.UNSIGNED, EssentialTypes.FLOAT], $startNode);
                    break;
                case "not":
                    this.restrictOperandList($startNode.operand, [EssentialTypes.BOOL, EssentialTypes.CHAR, EssentialTypes.ENUM, EssentialTypes.FLOAT, EssentialTypes.SIGNED], $startNode);
                    break;
            }
        }
    }

    private r10_2_appropriateCharOperands($startNode: Joinpoint) {
        if (!($startNode instanceof BinaryOp)) return;

        if ($startNode.kind === "add") {
            if (S10_EssentialTypePass.getExprEssentialType($startNode.left).category === EssentialTypes.CHAR && S10_EssentialTypePass.getExprEssentialType($startNode.right).category === EssentialTypes.CHAR) {
                this.logMISRAError(`Both operands of addition ${$startNode.code} have essentially character type.`);
                return;
            }
        
            let otherType;
            if (S10_EssentialTypePass.getExprEssentialType($startNode.left).category === EssentialTypes.CHAR) {
                otherType = S10_EssentialTypePass.getExprEssentialType($startNode.right);
            }
            else if (S10_EssentialTypePass.getExprEssentialType($startNode.right).category === EssentialTypes.CHAR) {
                otherType = S10_EssentialTypePass.getExprEssentialType($startNode.left);
            }

            if (otherType && !S10_EssentialTypePass.isInteger(otherType.category)) {
                this.logMISRAError(`One operand of addition ${$startNode.code} has essentially character type, so the other one must have either essentially signed or unsigned type.`);
                return;
            }
        }
        else if ($startNode.kind === "sub") {
            if (S10_EssentialTypePass.getExprEssentialType($startNode.left).category === EssentialTypes.CHAR) {
                const rightType = S10_EssentialTypePass.getExprEssentialType($startNode.right);
                if (!([EssentialTypes.CHAR, EssentialTypes.SIGNED, EssentialTypes.UNKOWN].some(et => et === rightType.category))) {
                    this.logMISRAError(`Left operand of subtraction ${$startNode.code} has essentially character type, so the RHS must be essentially signed, unsigned, or char.`);
                    return;
                }
            }
            else if (S10_EssentialTypePass.getExprEssentialType($startNode.right).category === EssentialTypes.CHAR) {
                this.logMISRAError(`Right operand of subtraction ${$startNode.code} can only be of essentially character type if the LHS is too.`);
                return;
            }
        }
    }

    private static isAssignable($t1: EssentialType, $t2: EssentialType) {
        if ($t1.category !== $t2.category) {
            return false;
        }
        else if ($t1.category === EssentialTypes.ENUM && $t1.enumName === $t2.enumName) {
            return false;
        }
        else return true;
    }

    private r10_3_noInvalidAssignments($startNode: Joinpoint) { //not working for decls, enum value not calculated, compound assignments
        if ($startNode instanceof BinaryOp && $startNode.kind === "assign") {
            if (!S10_EssentialTypePass.isAssignable(S10_EssentialTypePass.getExprEssentialType($startNode.left), S10_EssentialTypePass.getExprEssentialType($startNode.right))) {
                this.logMISRAError(`Value ${$startNode.right.code} cannot be assigned to ${$startNode.left.code}, since it has a different essential type category.`);
            }
            else if ($startNode.left.bitWidth < $startNode.right.bitWidth) {
                this.logMISRAError(`Value ${$startNode.right.code} cannot be assigned to ${$startNode.left.code} since it has a narrower type.`);
            }
        }
        else if ($startNode instanceof ReturnStmt) {
            const fun = $startNode.getAncestor("function") as FunctionJp;
            console.log($startNode.returnExpr.code, $startNode.returnExpr.bitWidth);
            console.log(fun.bitWidth);
            if (!S10_EssentialTypePass.isAssignable(S10_EssentialTypePass.getExprEssentialType($startNode.returnExpr), S10_EssentialTypePass.getEssentialType(fun.returnType))) {
                this.logMISRAError(`Value ${$startNode.returnExpr.code} cannot be returned by ${fun.signature}, since it has a different essential type category.`);
            }
            else if (fun.bitWidth < $startNode.returnExpr.bitWidth) {
                this.logMISRAError(`Value ${$startNode.returnExpr.code} cannot be returned by ${fun.signature} since it has a narrower type.`);
            }
        }
        else if ($startNode instanceof Call) {
            const funParams = $startNode.directCallee.params;
            for (let i = 0; i < funParams.length; i++) {
                if (!S10_EssentialTypePass.isAssignable(S10_EssentialTypePass.getEssentialType(funParams[i].type), S10_EssentialTypePass.getEssentialType($startNode.argList[i].type))) {
                    this.logMISRAError(`Value ${$startNode.argList[i].code} cannot be assigned to parameter ${funParams[i].code}, since it has a different essential type category.`);
                }
                else if (funParams[i].bitWidth < $startNode.argList[i].bitWidth) {
                    this.logMISRAError(`Value ${$startNode.argList[i].code} cannot be assigned to parameter ${funParams[i].code}, since it has a narrower type.`);
                }
            }
        }
    }

    private static checkBoolSource(subExpr: Expression) {
        if (S10_EssentialTypePass.getExprEssentialType(subExpr).category === EssentialTypes.BOOL) {
            return true;
        }
        else if (subExpr instanceof IntLiteral && (Number(subExpr.value) === 0 || Number(subExpr.value) === 1)) {
            return true;
        }
        else return false;
    }

    private r10_5_noInvalidCasts($startNode: Joinpoint) {//TODO: add char rules
        if (!($startNode instanceof Cast)) return;

        const subExpr = $startNode.subExpr;
        const toType = $startNode.toType.desugarAll;

        const toEssentialType = S10_EssentialTypePass.getEssentialType(toType);
        const fromEssentialType = S10_EssentialTypePass.getExprEssentialType(subExpr);

        if (toType instanceof BuiltinType) {
            console.log(toType.builtinKind)
        }

        if (toEssentialType.category === EssentialTypes.BOOL && !S10_EssentialTypePass.checkBoolSource($startNode.subExpr)) {
            this.logMISRAError("Only essentially boolean values, or the integer constants 0 or 1, may be cast to an essentially boolean type.");
        }
        else if (toEssentialType.category === EssentialTypes.ENUM && fromEssentialType.category === EssentialTypes.ENUM && toEssentialType.enumName !== fromEssentialType.enumName) {
            this.logMISRAError("Only essentially enum values of the same enum may be cast to an essentially enum type.");
        }
        else if (toEssentialType.category === EssentialTypes.SIGNED && fromEssentialType.category === EssentialTypes.BOOL) {
            this.logMISRAError("Essentially boolean values should not be cast to an essentially signed type.");
        }
        else if (toEssentialType.category === EssentialTypes.UNSIGNED && fromEssentialType.category === EssentialTypes.BOOL) {
            this.logMISRAError("Essentially boolean values should not be cast to an essentially unsigned type.");
        }
        else if (toEssentialType.category === EssentialTypes.FLOAT && fromEssentialType.category === EssentialTypes.BOOL) {
            this.logMISRAError("Essentially boolean values should not be cast to an essentially floating type.");
        }
    }

    private static isCompositeBinaryExpr($op: BinaryOp) {
        return /(add)|(sub)|(mul)|(div)|(rem)|(shl)|(shr)|(l_and)|(l_or)|(xor)/.test($op.kind);
    }

    private static isCompositeExpr($expr: Expression): Expression | undefined {
        if ($expr instanceof ParenExpr) {
            return this.isCompositeExpr($expr.subExpr);
        }
        else if ($expr instanceof BinaryOp) {
            if (this.isCompositeBinaryExpr($expr)) {
                return $expr;
            }
        }
        else if ($expr instanceof TernaryOp) {
            if (this.isCompositeExpr($expr.trueExpr) || this.isCompositeExpr($expr.falseExpr)) {
                return $expr;
            }
        }
        else return undefined;
    }

    private static compositeExprWidth($op: Expression): number {
        if ($op instanceof BinaryOp && S10_EssentialTypePass.isCompositeBinaryExpr($op)) {
            const leftW = S10_EssentialTypePass.compositeExprWidth($op.left);
            const rightW = S10_EssentialTypePass.compositeExprWidth($op.right);
            return Math.max(leftW, rightW);
        }
        else if ($op instanceof TernaryOp) {
            const secondW = S10_EssentialTypePass.compositeExprWidth($op.trueExpr);
            const thirdW = S10_EssentialTypePass.compositeExprWidth($op.falseExpr);
            return Math.min(secondW, thirdW);
        }
        else if ($op instanceof ParenExpr) {
            return this.compositeExprWidth($op.subExpr);
        }
        else return $op.bitWidth;
    }

    private static transformBinaryOp($expr: BinaryOp, $type: Type) {
        $expr.left.replaceWith(ClavaJoinPoints.cStyleCast($type, $expr.left));
    }

    private static transformTernaryOp($expr: TernaryOp, $type: Type, $bitWidth: number) {
        const trueExpr = this.isCompositeExpr($expr.trueExpr);
        const falseExpr = this.isCompositeExpr($expr.falseExpr);
        if (trueExpr && this.compositeExprWidth(trueExpr) < $bitWidth) {
            if (trueExpr instanceof TernaryOp) this.transformTernaryOp(trueExpr, $type, $bitWidth);
            else if (trueExpr instanceof BinaryOp) this.transformBinaryOp(trueExpr, $type);
        }

        if (falseExpr && this.compositeExprWidth(falseExpr) < $type.bitWidth) {
            if (falseExpr instanceof TernaryOp) this.transformTernaryOp(falseExpr, $type, $bitWidth);
            else if (falseExpr instanceof BinaryOp) this.transformBinaryOp(falseExpr, $type);
        }
    }

    private r10_6_noWiderCompositeExprAssignments($startNode: Joinpoint) { //unfinished for rets and params
        if (!($startNode instanceof Expression)) return;

        const compositeExpr = S10_EssentialTypePass.isCompositeExpr($startNode);
        if (compositeExpr) {
            const parent = $startNode.parent;
            if (parent instanceof BinaryOp && parent.kind === "assign") {
                if (S10_EssentialTypePass.compositeExprWidth(compositeExpr) < parent.left.bitWidth) {
                    this.logMISRAError("A composite expression must not be assigned to a value with wider type.", new Fix(compositeExpr, op => {
                        if (op instanceof BinaryOp) {
                            S10_EssentialTypePass.transformBinaryOp(op, op.parent.type);
                        }
                        else if (op instanceof TernaryOp) {
                            op.replaceWith(ClavaJoinPoints.cStyleCast(op.parent.type, op));
                        }
                    }));
                }
            }
        }
    }

    private r10_8_noWiderCompositeCasts($startNode: Joinpoint) {
        if (!($startNode instanceof Cast)) return;

        const compositeExpr = S10_EssentialTypePass.isCompositeExpr($startNode.subExpr);
        if (compositeExpr) {
            if (S10_EssentialTypePass.getEssentialType($startNode.fromType) !== S10_EssentialTypePass.getEssentialType($startNode.toType)) {
                this.logMISRAError(`Composite expression ${$startNode.subExpr.code} cannot be cast to ${$startNode.toType.code}, since it has a different essential type category.`);
            }
            else if ($startNode.bitWidth > S10_EssentialTypePass.compositeExprWidth(compositeExpr)) {
                this.logMISRAError(`Composite expression ${$startNode.subExpr.code} cannot be cast to ${$startNode.toType.code} since it is a wider type.`, new Fix($startNode, cast => {
                    const castJp = cast as Cast;
                    const compositeExpr = S10_EssentialTypePass.isCompositeExpr(castJp.subExpr);
                    if (compositeExpr instanceof BinaryOp) {
                        compositeExpr.left.replaceWith(ClavaJoinPoints.cStyleCast(cast.type, compositeExpr.left));
                        cast.replaceWith(compositeExpr);
                    }
                    else if (compositeExpr instanceof TernaryOp) {
                        S10_EssentialTypePass.transformTernaryOp(compositeExpr, cast.type, cast.bitWidth);
                    }
                }));
            }
        }
    }

    protected _name: string = "Essential type model";
    
}