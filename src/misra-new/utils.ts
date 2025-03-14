import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Comment, Type, Case, Joinpoint, ArrayType, TypedefDecl, DeclStmt, TypedefNameDecl, StorageClass, FunctionJp, Vardecl, FileJp, RecordJp, EnumDecl, PointerType, Switch, BuiltinType, BinaryOp } from "@specs-feup/clava/api/Joinpoints.js";

export function isInlineComment($comment: Comment): boolean {
    return $comment.astName === "InlineComment";
}

export function getComments($jp: Joinpoint): Comment[] {
    return $jp instanceof Comment ? [$jp] : $jp.inlineComments;
}

export function astContainsNode($jp: Joinpoint): boolean {
    return (Query.root() as Joinpoint).contains($jp);
}

export function getTypeDefs(): TypedefNameDecl[] {
    return Query.search(TypedefNameDecl).get();
}

export function hasExternalLinkage($class: StorageClass) {
    return $class !== StorageClass.STATIC && $class !== StorageClass.EXTERN;
}

export function getExternals(): (FunctionJp | Vardecl)[] {
    let result: (FunctionJp | Vardecl)[] = [];

    for (const file of  Query.search(FileJp).get()) {
        for(const child of file.children) {
            if((child instanceof Vardecl || child instanceof FunctionJp) && hasExternalLinkage(child.storageClass)) {
                result.push(child);
            }
        }
    }
    return result;
}

export function hasDefinedType($jp: Joinpoint): boolean {
    return $jp.hasType && $jp.type !== null || $jp.type !== undefined;
}

export function getBaseType($jp: Joinpoint): Type | undefined {
    if (!hasDefinedType($jp)) return undefined;

    let jpType: Type;
    if ($jp.type instanceof PointerType) {
        jpType = $jp.type.pointee;
        while (jpType instanceof PointerType) {
            jpType = jpType.pointee;
        }
    } else if ($jp.type instanceof ArrayType) {
        jpType = $jp.type.elementType;
    } else {
        jpType = $jp.type;
    }
    return jpType;
}

export function getTypeDecl($jp: Joinpoint): TypedefDecl | undefined {
    if ($jp instanceof DeclStmt && $jp.children.length === 1 && $jp.children[0] instanceof TypedefDecl)
        return $jp.children[0];

    if ($jp instanceof RecordJp || $jp instanceof EnumDecl) {
        const typeDecls = Query.searchFrom($jp, TypedefDecl).get(); 
        if (typeDecls.length === 1)
            return typeDecls[0];
    }
}

export function hasTypeDecl($jp: Joinpoint): boolean {
    return getTypeDecl($jp) !== undefined;
}

export function getTypedJps(startingPoint?: Joinpoint): Joinpoint[] {
    if (startingPoint) {
        return Query.searchFrom(startingPoint, Joinpoint).get().filter(jp => jp.hasType && jp.type !== null && jp.type !== undefined)
    }
    return Query.search(Joinpoint).get().filter(jp => 
        jp.hasType && 
        jp.type !== null && 
        jp.type !== undefined);
}

export function getLastStmtOfCase($jp: Case): Joinpoint | undefined {
    if ($jp.instructions.length === 0) { // Has a consecutive case
        return undefined;
    }

    let lastStmt: Joinpoint | undefined;
    for (const stmt of $jp.siblingsRight) {
        if (stmt instanceof Case) {
            break;
        }
        lastStmt = stmt;
    }
    return lastStmt;
} 

export function getNumOfSwitchClauses($jp: Switch): number  {
    let firstStatements = []

    for (const caseLabel of $jp.cases) {
        if (caseLabel.instructions.length === 0) { // Has a consecutive case
            continue;
        }
        firstStatements.push(caseLabel.instructions[0])
    }
    return firstStatements.length;
} 

export function switchHasBooleanCondition(switchStmt: Switch): boolean {
    return switchStmt.condition instanceof BinaryOp ||
            (hasDefinedType(switchStmt.condition) &&
             switchStmt.condition.type instanceof BuiltinType &&
              switchStmt.condition.type.builtinKind === "Bool"
            );
}

export function getSwitchConditionType(switchStmt: Switch): string | undefined {
    if (hasDefinedType(switchStmt.condition) && switchStmt.condition.type instanceof BuiltinType) {
        const conditionType = switchStmt.condition.type as BuiltinType;
        return conditionType.builtinKind;
    }
    return undefined;
}