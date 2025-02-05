import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";
import MISRAPass from "../MISRAPass.js";
import { PreprocessingReqs } from "../MISRAReporter.js";
import { BinaryOp, Field, FunctionJp, FunctionType, Joinpoint, Param, PointerType, QualType, Type, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";

export default class S18_PointersArraysPass extends MISRAPass {
    protected _preprocessingReqs: PreprocessingReqs[] = [];

    initRuleMapper(): void {
        this._ruleMapper = new Map([
            [4, this.r18_4_noPointerArithmetic.bind(this)],
            [5, this.r18_5_noExcessivePointerNesting.bind(this)],
            [7, this.r18_7_noFlexibleArrayMembers.bind(this)],
            [8, this.r18_8_noVariableLengthArrays.bind(this)]
        ]);
    }
    matchJoinpoint($jp: LaraJoinPoint): boolean {
        return $jp instanceof BinaryOp || $jp instanceof Vardecl || $jp instanceof FunctionJp || $jp instanceof Field;
    }

    private static isPointerType($type: Type): boolean {
        const newT = $type.desugarAll
        if (newT instanceof QualType) {
            return this.isPointerType(newT.unqualifiedType);
        }
        else return newT.isPointer;
    }

    private r18_4_noPointerArithmetic($startNode: Joinpoint) {
        if (!($startNode instanceof BinaryOp && /(\+=)|(-=)|(\+)|(-)/.test($startNode.operator))) return;

        const leftT = $startNode.left.type;
        const rightT = $startNode.right.type;

        if ((S18_PointersArraysPass.isPointerType(leftT) && !S18_PointersArraysPass.isPointerType(rightT))
            || (S18_PointersArraysPass.isPointerType(rightT) && !S18_PointersArraysPass.isPointerType(leftT))) {
            this.logMISRAError("Pointer arithmetic is not allowed. The only exception is if two pointers to elements of the same array are subtracted.")
        }
    }

    private static getDepth(type: Type) {
        let depth = 0;
        let curr = type.desugarAll;
        while (curr.isPointer === true) {
            depth++;
    
            if(curr instanceof PointerType) {
                curr = curr.pointee.desugarAll;    
            } else if(curr instanceof QualType) {
                curr = (curr.unqualifiedType as PointerType).pointee.desugarAll;    
            } else {
                throw new Error(`Not supported for type ${curr.joinPointType}.`);
            }
        }
    
        return depth;
    }

    private static getUnderlyingType(type: Type) {
        let curr = type.desugarAll;
        while (curr.isPointer === true) {
    
            if(curr instanceof PointerType) {
                curr = curr.pointee.desugarAll;    
            } else if(curr instanceof QualType) {
                curr = (curr.unqualifiedType as PointerType).pointee.desugarAll;    
            } else {
                throw new Error(`Not supported for type ${curr.joinPointType}.`);
            }
        }
    
        return curr;
    }

    private r18_5_noExcessivePointerNesting($startNode: Joinpoint) { //must apply to fields as well
        if (($startNode instanceof Vardecl && !($startNode instanceof Param)) || $startNode instanceof Field) {
            const depth = S18_PointersArraysPass.getDepth($startNode.type);
            const underlyingType = S18_PointersArraysPass.getUnderlyingType($startNode.type);
            if (underlyingType instanceof FunctionType) {
                const retDepth = S18_PointersArraysPass.getDepth(underlyingType.returnType);
                const paramDepths = underlyingType.paramTypes.map(type => S18_PointersArraysPass.getDepth(type)).filter(d => d > 2);
                if (retDepth > 2) {
                    this.logMISRAError(`Return type of function pointer ${$startNode.code} has more than two levels of indirection.`);
                }
                if (paramDepths.length > 0) {
                    this.logMISRAError(`One or more parameters of function pointer ${$startNode.code} have more than two levels of indirection.`);
                }
            }
            if (depth > 2) {
                this.logMISRAError(`Type ${$startNode.type.code} has more than two levels of indirection.`)
            }
        }
        else if ($startNode instanceof FunctionJp) {
            const retDepth = S18_PointersArraysPass.getDepth($startNode.functionType.returnType);
            const paramDepths = $startNode.functionType.paramTypes.map(type => S18_PointersArraysPass.getDepth(type)).filter(d => d > 2);
            if (retDepth > 2) {
                this.logMISRAError(`Return type of function ${$startNode.signature} has more than two levels of indirection.`);
            }
            if (paramDepths.length > 0) {
                this.logMISRAError(`One or more parameters of function ${$startNode.signature} have more than two levels of indirection.`);
            }
        }
    }

    private r18_7_noFlexibleArrayMembers($startNode: Joinpoint) {
        if (!($startNode instanceof Field)) return;
        if (!$startNode.type.desugarAll.isArray || $startNode instanceof Param) return;

        if ($startNode.type.desugarAll.arraySize === -1) {
            this.logMISRAError(`Array ${$startNode.name} has variable or undefined size.`);
        }
    }

    private r18_8_noVariableLengthArrays($startNode: Joinpoint) {
        if (!($startNode instanceof Vardecl)) return;
        if (!$startNode.type.desugarAll.isArray || $startNode.instanceOf("param")) return;

        if ($startNode.type.desugarAll.arraySize === -1) {
            this.logMISRAError(`Array ${$startNode.name} has variable or undefined size.`);
        }
    }


    protected _name: string = "Pointers and arrays";
    
}