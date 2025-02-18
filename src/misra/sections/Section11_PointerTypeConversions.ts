import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Program, FileJp, Cast, FunctionType, PointerType, BuiltinType, IntLiteral, Joinpoint, QualType } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAAnalyser from "../MISRAAnalyser.js";
import Section10_EssentialTypeModel, { EssentialTypes } from "./Section10_EssentialTypeModel.js";

export default class Section11_PointerTypeConversions extends MISRAAnalyser {
    ruleMapper: Map<string, (jp: Program | FileJp) => void>;
    
    constructor(rules?: string[]) {
        super(rules);
        this.ruleMapper = new Map([
            ["11.1", this.r11_1_noFunctionPointerConversions.bind(this)],
            ["11.4", this.r11_4_noIntToPointer.bind(this)],
            ["11.7", this.r11_7_noFloatConversions.bind(this)],
            ["11.5", this.r11_5_noConversionFromVoid.bind(this)]
        ]);
    }

    private static functionTypesMatch(t1: FunctionType, t2: FunctionType) {
        //console.log(t1.returnType.kind, t2.returnType.kind);
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
                if (!Section11_PointerTypeConversions.functionTypesMatch(fromType.pointee.desugarAll, toType.pointee.desugarAll)) {
                    this.logMISRAError(this.currentRule, cast, "A function pointer can only be converted into another function pointer if the types match.");

                }
            }
            else if (fromType instanceof PointerType && fromType.pointee.desugarAll instanceof FunctionType) {
                if (!(toType instanceof BuiltinType && toType.isVoid)) {
                    this.logMISRAError(this.currentRule, cast, "A function pointer can only be converted into another function pointer if the types match.");
                }
            }
            else if (toType instanceof PointerType && toType.pointee.desugarAll instanceof FunctionType) {
                if (!(cast.subExpr instanceof IntLiteral && Number(cast.subExpr.value) === 0)) {
                    this.logMISRAError(this.currentRule, cast, "Only null pointer constants can be converted into function pointers.");
                }
            }
        });
    }

    private r11_4_noIntToPointer($startNode: Joinpoint) {
        Query.searchFrom($startNode, Cast).get().forEach(cast => {
            const fromType = cast.fromType.desugarAll;
            const toType = cast.toType.desugarAll;
            if (fromType.isPointer !== toType.isPointer) {
                this.logMISRAError(this.currentRule, cast, "Integers should not be converted to pointers and vice-versa.");
            }
        })
    }

    private r11_5_noConversionFromVoid($startNode: Joinpoint) {
        Query.searchFrom($startNode, Cast).get().forEach(cast => {
            const fromType = cast.fromType.desugarAll;
            const toType =cast.toType.desugarAll;
            if (fromType instanceof PointerType && fromType.pointee instanceof BuiltinType && fromType.pointee.isVoid
                && toType instanceof PointerType && !(toType.pointee instanceof BuiltinType && toType.pointee.isVoid)) {
                this.logMISRAError(this.currentRule, cast, "Pointer to void should not be converted to pointer to object");
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
                this.logMISRAError(this.currentRule, cast, "A pointer to object cannot be cast to a non-integer arithmetic type.");
            }
            else if (toType instanceof PointerType && !(fromType instanceof PointerType)
                    && Section10_EssentialTypeModel.getEssentialType(fromType) !== EssentialTypes.SIGNED
                    && Section10_EssentialTypeModel.getEssentialType(fromType) !== EssentialTypes.UNSIGNED) {
                this.logMISRAError(this.currentRule, cast, "A non-arithmetic integer value cannot be cast to a pointer to object.");
            }
        }, this);
    }
}