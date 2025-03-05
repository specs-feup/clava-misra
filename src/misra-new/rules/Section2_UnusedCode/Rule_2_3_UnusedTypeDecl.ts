import { Joinpoint, Program, PointerType, TypedefDecl, TypedefType, ArrayType, Type, RecordJp, Class, DeclStmt, Struct } from "@specs-feup/clava/api/Joinpoints.js";
import MISRARule from "../../MISRARule.js";
import MISRAContext from "../../MISRAContext.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { MISRATransformationReport, MISRATransformationType } from "../../MISRA.js";

/**
 * MISRA-C Rule 2.3: A project should not contain unused ty pe declarations.
 */
export default class Rule_2_3_UnusedTypeDecl extends MISRARule {

    constructor(context: MISRAContext) {
        super("2.3", context);
    }

    private isTypedefUsed(jp: Joinpoint, typeDecl: TypedefDecl): boolean {
        if (!jp.hasType || jp.type === null || jp.type === undefined) return false;
        
        let jpType: Type;
        if (jp.type instanceof PointerType) {
            jpType = jp.type.pointee;
            while (jpType instanceof PointerType) {
                jpType = jpType.pointee;
            }
        } else if (jp.type instanceof ArrayType) {
            jpType = jp.type.elementType;
        } else {
            jpType = jp.type;
        }

        return !jpType.isBuiltin && jpType instanceof TypedefType && jpType.decl.astId === typeDecl.astId;
    }

    private searchTypeDefUse(typeDecl: TypedefDecl): Joinpoint[] {
    const jps = Query.search(Joinpoint).get().filter(j => j.hasType);
        const uses = jps.filter(jp => 
            this.isTypedefUsed(jp as Joinpoint, typeDecl)
        ) as Joinpoint[];
         
        return uses;
    }

    private getTypeDecl($jp: Joinpoint): TypedefDecl | undefined {
        if ($jp instanceof DeclStmt && $jp.children.length === 1 && $jp.children[0] instanceof TypedefDecl)
            return $jp.children[0];
        if($jp instanceof RecordJp && $jp.children?.length > 0 && $jp.lastChild.children?.length === 1 && $jp.lastChild.children[0] instanceof TypedefDecl)
            return $jp.lastChild.children[0];
    }

    match($jp: Joinpoint, logErrors: boolean = false): boolean {
        const typeDecl = this.getTypeDecl($jp);
        if (typeDecl === undefined) return false;

        const uses = this.searchTypeDefUse(typeDecl);
        if (logErrors && uses.length === 0) {
            this.logMISRAError($jp, `Type declaration ${typeDecl.name} is unused.`)
        }
        return uses.length === 0;
    }
    
    transform($jp: Joinpoint): MISRATransformationReport {
        if (!this.match($jp)) 
            return new MISRATransformationReport(MISRATransformationType.NoChange);
        
        $jp.detach();
        return new MISRATransformationReport(MISRATransformationType.Removal);
    }
}
