import Query from "lara-js/api/weaver/Query.js";
import { Program, FileJp, TernaryOp, UnaryOp, BinaryOp, Joinpoint, Cast, BuiltinType, Type, Expression, IntLiteral, EnumType, QualType, ReturnStmt, FunctionJp, Call, Op, ParenExpr } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export enum EssentialTypes {
    UNSIGNED,
    CHAR,
    SIGNED,
    ENUM,
    FLOAT,
    BOOL,
    UNKOWN
};

export default class Section10_EssentialTypeModel extends MISRAAnalyser {
    ruleMapper: Map<number, (jp: Program | FileJp) => void>;

    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [1, this.r10_1_appropriateEssentialOperands.bind(this)],
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
    
    private r10_1_appropriateEssentialOperands($startNode: Joinpoint) { //incomplete
        Query.searchFrom($startNode, TernaryOp).get().forEach(tOp => {
            if (Section10_EssentialTypeModel.getEssentialType(tOp.cond.type) !== EssentialTypes.BOOL) {//best way?
                this.logMISRAError(tOp, `First operand of ternay operation ${tOp.cond.code} must have essentially boolean type.`);
            }
        }, this);
        Query.searchFrom($startNode, UnaryOp).get().forEach(uOp => {
            switch (uOp.kind) {
                case "not":
                    if (Section10_EssentialTypeModel.getEssentialType(uOp.operand.type) !== EssentialTypes.BOOL) {
                        this.logMISRAError(uOp, `Operand ${uOp.operand.code} of negation operator must have essentially boolean type.`);
                    }
                    break;
                case "minus":
                    if (Section10_EssentialTypeModel.getEssentialType(uOp.operand.type) === EssentialTypes.UNSIGNED) {
                        this.logMISRAError(uOp, `Operand ${uOp.operand.code} of unary minus must not have essentially unsigned type.`);
                    }
                    break;
                    
            }
        });
        Query.searchFrom($startNode, BinaryOp).get().forEach(bOp => {
            switch (bOp.kind) {
                case "and":
                case "or":
                    if (Section10_EssentialTypeModel.getEssentialType(bOp.left.type) !== EssentialTypes.BOOL 
                    || Section10_EssentialTypeModel.getEssentialType(bOp.right.type) !== EssentialTypes.BOOL) {
                        this.logMISRAError(bOp, `Operands of boolean expression ${bOp.code} must have essentially boolean type.`);
                    }
                    break;
                case "div":
                case "mul":
                case "rem":
                case "shl":
                case "shr":
                    if (Section10_EssentialTypeModel.getEssentialType(bOp.right.type) !== EssentialTypes.UNSIGNED) {
                        this.logMISRAError(bOp, `RHS of shift expression ${bOp.code} must have essentially unsigned type.`);
                    }
                    if (Section10_EssentialTypeModel.getEssentialType(bOp.left.type) !== EssentialTypes.UNSIGNED) {
                        this.logMISRAError(bOp, `LHS of shift expression ${bOp.code} must have essentially unsigned type.`);
                    }
                    break;
                case "l_and":
                case "l_or":
                case "xor":
                    break;
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