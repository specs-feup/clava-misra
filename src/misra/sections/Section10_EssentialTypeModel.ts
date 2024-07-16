import Query from "lara-js/api/weaver/Query.js";
import { Program, FileJp, TernaryOp, UnaryOp, BinaryOp, Joinpoint, Cast, BuiltinType, Type, Expression, IntLiteral, EnumType, QualType, ReturnStmt, FunctionJp, Call, Op, ParenExpr, Varref } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export enum EssentialTypes {
    UNSIGNED = "unsigned",
    CHAR = "char",
    SIGNED = "signed",
    ENUM = "enum",
    FLOAT = "float",
    BOOL = "bool",
    UNKOWN = "unkown"
};

export default class Section10_EssentialTypeModel extends MISRAAnalyser {
    ruleMapper: Map<number, (jp: Program | FileJp) => void>;

    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [1, this.r10_1_appropriateEssentialOperands.bind(this)],
            [2, this.r10_2_appropriateCharOperands.bind(this)],
            [3, this.r10_3_noInvalidAssignments.bind(this)],
            [5, this.r10_5_noInvalidCasts.bind(this)],
            [6, this.r10_6_noWiderCompositeExprAssignments.bind(this)],
            [8, this.r10_8_noWiderCompositeCasts.bind(this)]
        ]);
    }

    static getEssentialType(bType: Type): EssentialTypes {
        let type = bType.desugarAll;
        while (type instanceof QualType) {
            type = type.unqualifiedType.desugarAll;
        }

        if (type instanceof BuiltinType) {
            if (type.builtinKind === "Bool") {
                return EssentialTypes.BOOL;
            }
            else if (type.builtinKind === "Char_S") {
                return EssentialTypes.CHAR;
            }
            else if (type.isInteger && type.isSigned) {
                return EssentialTypes.SIGNED;
            }
            else if (type.isInteger && !type.isSigned) {
                return EssentialTypes.UNSIGNED;
            }
            else if (type.isFloat) {
                return EssentialTypes.FLOAT;
            }
        }
        else if (type instanceof EnumType) {
            return EssentialTypes.ENUM;
        }

        return EssentialTypes.UNKOWN;
    }

    static isInteger($et: EssentialTypes): boolean {
        return $et === EssentialTypes.SIGNED || $et === EssentialTypes.UNSIGNED;
    }

    static getExprEssentialType($expr: Expression): EssentialTypes {
        if ($expr instanceof BinaryOp) {
            if ($expr.kind === "add") {
                if ((this.getExprEssentialType($expr.left) === EssentialTypes.CHAR && this.isInteger(this.getExprEssentialType($expr.right)))
                        || (this.getExprEssentialType($expr.right) === EssentialTypes.CHAR && this.isInteger(this.getExprEssentialType($expr.left)))) {
                    return EssentialTypes.CHAR;
                }
            }
            else if ($expr.kind === "sub") {
                if (this.getExprEssentialType($expr.left) === EssentialTypes.CHAR) {
                    if (this.getExprEssentialType($expr.right) === EssentialTypes.CHAR) {
                        return EssentialTypes.CHAR;
                    }
                }
            }
        }
        return this.getEssentialType($expr.type);
    }

    private restrictOperand($expr: Expression, $restrictedType: EssentialTypes, $baseExpr: Expression) {
        const et = Section10_EssentialTypeModel.getExprEssentialType($expr);
        if (et === $restrictedType) {
            this.logMISRAError($baseExpr, `Operand ${$expr.code} of expression ${$baseExpr.code} must not have essentially ${et} type.`);
        }
    }

    private restrictOperandList($expr: Expression, $restrictedTypes: EssentialTypes[], $baseExpr: Expression) {
        for (const type of $restrictedTypes) {
            this.restrictOperand($expr, type, $baseExpr);
        }
    }
    
    private r10_1_appropriateEssentialOperands($startNode: Joinpoint) { //missing exception and compound operators
        Query.searchFrom($startNode, Op).get().forEach(op => {
            if (op instanceof TernaryOp) {
                this.restrictOperandList(op.cond, [EssentialTypes.CHAR, EssentialTypes.ENUM, EssentialTypes.FLOAT, EssentialTypes.SIGNED, EssentialTypes.UNSIGNED], op);
            }
            else if (op instanceof BinaryOp) {
                switch (op.kind) {
                    case "shl":
                    case "shr":
                    case "and":
                    case "or":
                    case "x_or":
                        this.restrictOperand(op.left, EssentialTypes.SIGNED, op);
                        this.restrictOperand(op.right, EssentialTypes.SIGNED, op);
                    case "rem":
                        this.restrictOperand(op.left, EssentialTypes.FLOAT, op);
                        this.restrictOperand(op.right, EssentialTypes.FLOAT, op);
                    case "mul":
                    case "div":
                        this.restrictOperand(op.left, EssentialTypes.CHAR, op);
                        this.restrictOperand(op.right, EssentialTypes.CHAR, op);
                    case "add":
                    case "sub":
                        this.restrictOperand(op.left, EssentialTypes.ENUM, op);
                        this.restrictOperand(op.right, EssentialTypes.ENUM, op);
                    case "le":
                    case "ge":
                    case "lt":
                    case "gt":
                        this.restrictOperand(op.left, EssentialTypes.BOOL, op);
                        this.restrictOperand(op.right, EssentialTypes.BOOL, op);
                        break;
                    case "l_and":
                    case "l_or":
                        this.restrictOperandList(op.left, [EssentialTypes.ENUM, EssentialTypes.CHAR, EssentialTypes.SIGNED, EssentialTypes.UNSIGNED, EssentialTypes.FLOAT], op);
                        this.restrictOperandList(op.right, [EssentialTypes.ENUM, EssentialTypes.CHAR, EssentialTypes.SIGNED, EssentialTypes.UNSIGNED, EssentialTypes.FLOAT], op);
                        break;
                }
            }
            else if (op instanceof UnaryOp) {
                switch (op.kind) {
                    case "minus":
                        this.restrictOperand(op.operand, EssentialTypes.UNSIGNED, op);
                    case "plus":
                        this.restrictOperandList(op.operand, [EssentialTypes.BOOL, EssentialTypes.CHAR, EssentialTypes.ENUM], op);
                        break;
                    case "l_not":
                        this.restrictOperandList(op.operand, [EssentialTypes.ENUM, EssentialTypes.CHAR, EssentialTypes.SIGNED, EssentialTypes.UNSIGNED, EssentialTypes.FLOAT], op);
                        break;
                    case "not":
                        this.restrictOperandList(op.operand, [EssentialTypes.BOOL, EssentialTypes.CHAR, EssentialTypes.ENUM, EssentialTypes.FLOAT, EssentialTypes.SIGNED], op);
                        break;
                }
            }
        }, this);
    }

    private r10_2_appropriateCharOperands($startNode: Joinpoint) {
        Query.searchFrom($startNode, BinaryOp, {kind: /(add|sub)/}).get().forEach(bOp => {
            if (bOp.kind === "add") {
                if (Section10_EssentialTypeModel.getExprEssentialType(bOp.left) === EssentialTypes.CHAR && Section10_EssentialTypeModel.getExprEssentialType(bOp.right) === EssentialTypes.CHAR) {
                    this.logMISRAError(bOp, `Both operands of addition ${bOp.code} have essentially character type.`);
                    return;
                }
            
                let otherType;
                if (Section10_EssentialTypeModel.getExprEssentialType(bOp.left) === EssentialTypes.CHAR) {
                    otherType = Section10_EssentialTypeModel.getExprEssentialType(bOp.right);
                }
                else if (Section10_EssentialTypeModel.getExprEssentialType(bOp.right) === EssentialTypes.CHAR) {
                    otherType = Section10_EssentialTypeModel.getExprEssentialType(bOp.left);
                }

                if (otherType && !Section10_EssentialTypeModel.isInteger(otherType)) {
                    this.logMISRAError(bOp, `One operand of addition ${bOp.code} has essentially character type, so the other one must have either essentially signed or unsigned type.`);
                    return;
                }
            }
            else if (bOp.kind === "sub") {
                if (Section10_EssentialTypeModel.getExprEssentialType(bOp.left) === EssentialTypes.CHAR) {
                    const rightType = Section10_EssentialTypeModel.getExprEssentialType(bOp.right);
                    if (!([EssentialTypes.CHAR, EssentialTypes.SIGNED, EssentialTypes.UNKOWN].some(et => et === rightType))) {
                        this.logMISRAError(bOp, `Left operand of subtraction ${bOp.code} has essentially character type, so the RHS must be essentially signed, unsigned, or char.`);
                        return;
                    }
                }
                else if (Section10_EssentialTypeModel.getExprEssentialType(bOp.right) === EssentialTypes.CHAR) {
                    this.logMISRAError(bOp, `Right operand of subtraction ${bOp.code} can only be of essentially character type if the LHS is too.`);
                    return;
                }
            }
        }, this);
    }

    private r10_3_noInvalidAssignments($startNode: Joinpoint) { //not working for decls
        Query.searchFrom($startNode, BinaryOp, {kind: "assign"}).get().forEach(bOp => {
            if (Section10_EssentialTypeModel.getEssentialType(bOp.left.type) !== Section10_EssentialTypeModel.getEssentialType(bOp.right.type)) {
                this.logMISRAError(bOp, `Value ${bOp.right.code} cannot be assigned to ${bOp.left.code}, since it has a different essential type category.`);
            }
            else if (bOp.left.bitWidth < bOp.right.bitWidth) {
                this.logMISRAError(bOp, `Value ${bOp.right.code} cannot be assigned to ${bOp.left.code} since it has a narrower type.`);
            }
        }, this);
        Query.searchFrom($startNode, ReturnStmt).get().forEach(ret => {
            const fun = ret.getAncestor("function") as FunctionJp;
            console.log(ret.returnExpr.code, ret.returnExpr.bitWidth);
            console.log(fun.bitWidth);
            if (Section10_EssentialTypeModel.getEssentialType(ret.returnExpr.type) !== Section10_EssentialTypeModel.getEssentialType(fun.returnType)) {
                this.logMISRAError(ret, `Value ${ret.returnExpr.code} cannot be returned by ${fun.signature}, since it has a different essential type category.`);
            }
            else if (fun.bitWidth < ret.returnExpr.bitWidth) {
                this.logMISRAError(ret, `Value ${ret.returnExpr.code} cannot be returned by ${fun.signature} since it has a narrower type.`);
            }
        }, this);
        Query.searchFrom($startNode, Call).get().forEach(call => {
            const funParams = call.directCallee.params;
            for (let i = 0; i < funParams.length; i++) {
                if (Section10_EssentialTypeModel.getEssentialType(funParams[i].type) !== Section10_EssentialTypeModel.getEssentialType(call.argList[0].type)) {
                    this.logMISRAError(call, `Value ${call.argList[i].code} cannot be assigned to parameter ${funParams[i].code}, since it has a different essential type category.`);
                }
                else if (funParams[i].bitWidth < call.argList[i].bitWidth) {
                    this.logMISRAError(call, `Value ${call.argList[i].code} cannot be assigned to parameter ${funParams[i].code}, since it has a narrower type.`);
                }
            }
        }, this);
    }

    private static checkBoolSource(subExpr: Expression) {
        if (subExpr.type.desugarAll instanceof BuiltinType && subExpr.type.desugarAll.builtinKind === "Bool") {
            return true;
        }
        else if (subExpr instanceof IntLiteral && (Number(subExpr.value) === 0 || Number(subExpr.value) === 1)) {
            return true;
        }
        else return false;
    }

    private r10_5_noInvalidCasts($startNode: Joinpoint) {//chars, anonymous enums
        Query.searchFrom($startNode, Cast).get().forEach(cast => {
            const fromType = cast.fromType.desugarAll;
            const toType = cast.toType.desugarAll;

            if (toType instanceof BuiltinType) {
                console.log(toType.builtinKind)
            }

            if (toType instanceof BuiltinType && toType.builtinKind === "Bool" && !Section10_EssentialTypeModel.checkBoolSource(cast.subExpr)) {
                this.logMISRAError(cast, "Only essentially boolean values, or the integer constants 0 or 1, may be cast to an essentially boolean type.");
            }
            else if (toType instanceof EnumType && !(fromType instanceof EnumType && toType.name === fromType.name)) {
                this.logMISRAError(cast, "Only essentially enum values of the same enum may be cast to an essentially enum type.");
            }
            else if (toType instanceof BuiltinType && toType.builtinKind === "Int" && toType.isSigned && fromType instanceof BuiltinType && fromType.builtinKind === "Bool") {
                this.logMISRAError(cast, "Essentially boolean values should not be cast to an essentially signed type.");
            }
            else if (toType instanceof BuiltinType && toType.builtinKind === "Int" && !toType.isSigned && fromType instanceof BuiltinType && fromType.builtinKind === "Bool") {
                this.logMISRAError(cast, "Essentially boolean values should not be cast to an essentially unsigned type.");
            }
            else if (toType instanceof BuiltinType && toType.isFloat && fromType instanceof BuiltinType && fromType.builtinKind === "Bool") {
                this.logMISRAError(cast, "Essentially boolean values should not be cast to an essentially floating type.");
            }
        }, this);
    }

    private static isCompositeBinaryExpr($op: BinaryOp) {
        return /(add)|(sub)|(mul)|(div)|(rem)|(shl)|(shr)|(l_and)|(l_or)|(xor)/.test($op.kind);
    }

    private static isCompositeExpr($expr: Expression): boolean {
        if ($expr instanceof ParenExpr) {
            return this.isCompositeExpr($expr.subExpr);
        }
        else if ($expr instanceof BinaryOp) {
            return this.isCompositeBinaryExpr($expr);
        }
        else if ($expr instanceof TernaryOp) {
            return true;
        }
        else return false;
    }

    private static compositeExprWidth($op: Expression): number {
        if ($op instanceof BinaryOp && Section10_EssentialTypeModel.isCompositeBinaryExpr($op)) {
            const leftW = Section10_EssentialTypeModel.compositeExprWidth($op.left);
            const rightW = Section10_EssentialTypeModel.compositeExprWidth($op.right);
            return Math.max(leftW, rightW);
        }
        else if ($op instanceof TernaryOp) {
            const secondW = Section10_EssentialTypeModel.compositeExprWidth($op.trueExpr);
            const thirdW = Section10_EssentialTypeModel.compositeExprWidth($op.falseExpr);
            return Math.min(secondW, thirdW);
        }
        else if ($op instanceof ParenExpr) {
            return this.compositeExprWidth($op.subExpr);
        }
        else return $op.bitWidth;
    }

    private r10_6_noWiderCompositeExprAssignments($startNode: Joinpoint) { //unfinished for rets and params
        Query.searchFrom($startNode, Op, {kind: /(add)|(sub)|(mul)|(div)|(rem)|(shl)|(shr)|(l_and)|(l_or)|(xor)/}).get().forEach(op => {
            const parent = op.parent;
            if (parent instanceof BinaryOp && parent.kind === "assign") {
                if (Section10_EssentialTypeModel.compositeExprWidth(op) < parent.left.bitWidth) {
                    this.logMISRAError(op, "A composite expression must not be assigned to a value with wider type.");
                }
            }
        }, this);
    }

    private r10_8_noWiderCompositeCasts($startNode: Joinpoint) {
        Query.searchFrom($startNode, Cast).get().forEach(cast => {
            if (Section10_EssentialTypeModel.isCompositeExpr(cast.subExpr)) {
                if (Section10_EssentialTypeModel.getEssentialType(cast.fromType) !== Section10_EssentialTypeModel.getEssentialType(cast.toType)) {
                    this.logMISRAError(cast, `Composite expression ${cast.subExpr.code} cannot be cast to ${cast.toType.code}, since it has a different essential type category.`);
                }
                else if (cast.bitWidth > Section10_EssentialTypeModel.compositeExprWidth(cast.subExpr)) {
                    this.logMISRAError(cast, `Composite expression ${cast.subExpr.code} cannot be cast to ${cast.toType.code} since it is a wider type.`)
                }
            }
        });
    }
}