import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Program, FileJp, Joinpoint, BinaryOp, Field, Param, Vardecl, FunctionJp, Type, PointerType, QualType, FunctionType } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";

export default class Section18_PointersAndArrays extends MISRAAnalyser {
    ruleMapper: Map<string, (jp: Program | FileJp) => void>;
    
    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["18.4", this.r18_4_noPointerArithmetic.bind(this)],
            ["18.5", this.r18_5_noExcessivePointerNesting.bind(this)],
            ["18.7", this.r18_7_noFlexibleArrayMembers.bind(this)],
            ["18.8", this.r18_8_noVariableLengthArrays.bind(this)]
        ]);
    }

    private r18_4_noPointerArithmetic($startNode: Joinpoint) {
        for (const bOp of Query.searchFrom($startNode, BinaryOp, {operator: /(\+=)|(-=)|(\+)|(-)/})) {
            if (!bOp.type.isPointer) continue;
            this.logMISRAError(this.currentRule, bOp, "Pointer arithmetic is not allowed. The only exception is if two pointers to elements of the same array are subtracted.")
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
        Query.searchFrom($startNode, Vardecl).get().forEach(decl => {
            if (decl instanceof Param) return;
            const depth = Section18_PointersAndArrays.getDepth(decl.type);
            const underlyingType = Section18_PointersAndArrays.getUnderlyingType(decl.type);
            if (underlyingType instanceof FunctionType) {
                const retDepth = Section18_PointersAndArrays.getDepth(underlyingType.returnType);
                const paramDepths = underlyingType.paramTypes.map(type => Section18_PointersAndArrays.getDepth(type)).filter(d => d > 2);
                if (retDepth > 2) {
                    this.logMISRAError(this.currentRule, decl, `Return type of function pointer ${decl.code} has more than two levels of indirection.`);
                }
                if (paramDepths.length > 0) {
                    this.logMISRAError(this.currentRule, decl, `One or more parameters of function pointer ${decl.code} have more than two levels of indirection.`);
                }
            }
            if (depth > 2) {
                this.logMISRAError(this.currentRule, decl, `Type ${decl.type.code} has more than two levels of indirection.`)
            }
        }, this);
        
        Query.searchFrom($startNode, FunctionJp).get().forEach(fun => {
            const retDepth = Section18_PointersAndArrays.getDepth(fun.functionType.returnType);
            const paramDepths = fun.functionType.paramTypes.map(type => Section18_PointersAndArrays.getDepth(type)).filter(d => d > 2);
            if (retDepth > 2) {
                this.logMISRAError(this.currentRule, fun, `Return type of function ${fun.signature} has more than two levels of indirection.`);
            }
            if (paramDepths.length > 0) {
                this.logMISRAError(this.currentRule, fun, `One or more parameters of function ${fun.signature} have more than two levels of indirection.`);
            }
        }, this);
    }

    private r18_7_noFlexibleArrayMembers($startNode: Joinpoint) {
        for (const varDecl of Query.searchFrom($startNode, Field)) {
            if (!varDecl.type.isArray || varDecl instanceof Param) continue;
            if (varDecl.type.arraySize === -1) {
                this.logMISRAError(this.currentRule, varDecl, `Array ${varDecl.name} has variable or undefined size.`);
            }
        }
    }

    private r18_8_noVariableLengthArrays($startNode: Joinpoint) {
        for (const varDecl of Query.searchFrom($startNode, Vardecl)) {
            if (!varDecl.type.isArray || varDecl.instanceOf("param")) continue;
            if (varDecl.type.arraySize === -1) {
                this.logMISRAError(this.currentRule, varDecl, `Array ${varDecl.name} has variable or undefined size.`);
            }
        }
    }
}