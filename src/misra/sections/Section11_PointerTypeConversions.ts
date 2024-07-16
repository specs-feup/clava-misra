import Query from "lara-js/api/weaver/Query.js";
import { Program, FileJp, Cast, FunctionType, PointerType, BuiltinType, IntLiteral, Joinpoint, QualType } from "clava-js/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import Section10_EssentialTypeModel, { EssentialTypes } from "./Section10_EssentialTypeModel.js";

export default class Section11_PointerTypeConversions extends MISRAAnalyser {
    ruleMapper: Map<number, (jp: Program | FileJp) => void>;
    
    constructor(rules: number[]) {
        super(rules);
        this.ruleMapper = new Map([
            [7, this.r11_7_noFloatConversions.bind(this)]
        ]);
    }

    private static functionTypesMatch(t1: FunctionType, t2: FunctionType) {
        console.log(t1.returnType.kind, t2.returnType.kind);
        if (t1.returnType != t2.returnType) {
            return false;
        }
        if (t1.paramTypes.length !== t2.paramTypes.length) {
            return false;
        }
        for (let i = 0; i < t1.paramTypes.length; i++) {
            if (t1.paramTypes[i] != t2.paramTypes[i]) {
                return false;
            }
        }
    
        return true;
    }

    private r11_1_noFunctionPointerConversions($startNode: Joinpoint) { //type equality not working
        Query.searchFrom($startNode, Cast).get().forEach(cast => {
            const fromType = cast.fromType.desugarAll;
            const toType = cast.toType.desugarAll;

            if (fromType instanceof PointerType && toType instanceof PointerType && fromType.pointee.desugarAll instanceof FunctionType && toType.pointee.desugarAll instanceof FunctionType) {
                console.log("hello");
                if (!Section11_PointerTypeConversions.functionTypesMatch(fromType.pointee.desugarAll, toType.pointee.desugarAll)) {
                    this.logMISRAError(cast, "A function pointer can only be converted into another function pointer if the types match.");

                }
            }
            else if (fromType instanceof PointerType && fromType.pointee.desugarAll instanceof FunctionType) {
                if (!(toType instanceof BuiltinType && toType.isVoid)) {
                    this.logMISRAError(cast, "A function pointer can only be converted into another function pointer if the types match.");
                }
            }
            else if (toType instanceof PointerType && toType.pointee.desugarAll instanceof FunctionType) {
                if (!(cast.subExpr instanceof IntLiteral && Number(cast.subExpr.value) === 0)) {
                    this.logMISRAError(cast, "Only null pointer constants can be converted into function pointers.");
                }
            }
        });
    }

    private r11_4_noIntToPointer($startNode: Joinpoint) {
        Query.searchFrom($startNode, Cast).get().forEach(cast => {
            const fromType = cast.fromType.desugarAll;
            const toType = cast.toType.desugarAll;
            if (fromType.isPointer !== toType.isPointer) {
                this.logMISRAError(cast, "Integers should not be converted to pointers and vice-versa.");
            }
        })
    }

    private r11_5_noConversionFromVoid($startNode: Joinpoint) {
        Query.searchFrom($startNode, Cast).get().forEach(cast => {
            const fromType = cast.fromType.desugarAll;
            const toType =cast.toType.desugarAll;
            if (fromType instanceof PointerType && fromType.pointee instanceof BuiltinType && fromType.pointee.isVoid
                && toType instanceof PointerType && !(toType.pointee instanceof BuiltinType && toType.pointee.isVoid)) {
                this.logMISRAError(cast, "Pointer to void should not be converted to pointer to object");
            }
        });
    }

    private r11_7_noFloatConversions($startNode: Joinpoint) {
        Query.searchFrom($startNode, Cast).get().forEach(cast => {
            let fromType = cast.fromType.desugarAll;
            let toType = cast.fromType.desugarAll;

            if (fromType instanceof QualType) {
                fromType = fromType.unqualifiedType.desugarAll;
            }
            if (toType instanceof QualType) {
                toType = toType.unqualifiedType.desugarAll;
            }

            if (fromType instanceof PointerType && !(toType instanceof PointerType)
                    && Section10_EssentialTypeModel.getEssentialType(toType) !== EssentialTypes.SIGNED
                    && Section10_EssentialTypeModel.getEssentialType(toType) !== EssentialTypes.UNSIGNED) {
                this.logMISRAError(cast, "A pointer to object cannot be cast to a non-integer arithmetic type.");
            }
            else if (toType instanceof PointerType && !(fromType instanceof PointerType)
                    && Section10_EssentialTypeModel.getEssentialType(fromType) !== EssentialTypes.SIGNED
                    && Section10_EssentialTypeModel.getEssentialType(fromType) !== EssentialTypes.UNSIGNED) {
                this.logMISRAError(cast, "A non-arithmetic integer value cannot be cast to a pointer to object.");
            }
        }, this);
    }
}