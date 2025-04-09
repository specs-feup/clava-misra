import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Comment, Type, Case, Joinpoint, ArrayType, TypedefDecl, DeclStmt, TypedefNameDecl, StorageClass, FunctionJp, Vardecl, FileJp, RecordJp, EnumDecl, PointerType, Switch, BuiltinType, BinaryOp, Break, Scope, Statement, Expression, WrapperStmt, ElaboratedType, TagType, Param, Varref } from "@specs-feup/clava/api/Joinpoints.js";

/**
 * Checks if the comment is an inline comment
 * @param $comment - The comment to check
 * @returns Returns true if it's an inline comment, otherwise returns false
 */
export function isInlineComment($comment: Comment): boolean {
    return $comment.astName === "InlineComment";
}

/**
 * Retrieves all comments associated with a given joinpoint
 * @param $jp - The joinpoint to retrieve comments from
 * @returns Array of comments
 */
export function getComments($jp: Joinpoint): Comment[] {
    return $jp instanceof Comment ? [$jp] : $jp.inlineComments;
}

/**
 * Checks if a given join point is a comment statement
 *
 * @param $jp The join point to check
 * @returns Returns true if the given join point is a comment statement, otherwise false
 */
export function isCommentStmt($jp: Joinpoint): boolean {
    return $jp instanceof WrapperStmt && $jp.kind === "comment";
}

export function getParamReferences($param: Param, $startingPoint: Joinpoint): Varref[] {
    return Query.searchFrom($startingPoint, Varref, (ref) => {
                try {
                    return ref.decl && ref.decl.astId === $param.astId;
                } catch (error) {
                    return false;
                }
            }).get();
}

/**
 * Checks if a storage class has external linkage
 * @param $class - The storage class to check
 * @returns Returns true if the class has external linkage, otherwise returns false
 */
export function hasExternalLinkage($class: StorageClass) {
    return $class !== StorageClass.STATIC && $class !== StorageClass.EXTERN;
}

/**
 * Retrieves all variables and functions that can be externed from the files, i.e., 
 * elements with storage classes that are not `STATIC` or `EXTERN`
 * @returns Array of functions and variables that can be externed
 */
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

/**
 * Checks if the provided node has a defined type
 * @param $jp The joinpoint to check its type
 * @returns true if the joinpoint has a defined type, otherwise false
 */
export function hasDefinedType($jp: Joinpoint): boolean {
    return $jp.hasType && $jp.type !== null || $jp.type !== undefined;
}

/**
 * Retrieves the base type of the provided joinpoint. 
 * @param $jp The joinpoint to retrieve its type
 * @returns The base type of the joinpoint, or undefined if the type is not defined
 */
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

/**
 * Retrieves the typedef declaration for the provided joinpoint, if available
 * @param $jp The joinpoint to analyze
 * @returns The typedef declaration if found, or undefined if not
 */
export function getTypeDecl($jp: Joinpoint): TypedefDecl | undefined {
    if ($jp instanceof DeclStmt && $jp.children.length === 1 && $jp.children[0] instanceof TypedefDecl)
        return $jp.children[0];

    if ($jp instanceof RecordJp || $jp instanceof EnumDecl) {
        const typeDecls = Query.searchFrom($jp, TypedefDecl).get(); 
        if (typeDecls.length === 1)
            return typeDecls[0];
    }
}

/**
 * Checks if the provided joinpoint declares a type (typedef)
 * @param $jp The joinpoint to check
 * @returns Returns true if the joinpoint declares a typedef, otherwise false
 */
export function hasTypeDecl($jp: Joinpoint): boolean {
    return getTypeDecl($jp) !== undefined;
}

/**
 * Retrieves all joinpoints with a defined type 
 * @returns Array of joinpoints with a defined type
 */
export function getTypedJps(startingPoint?: Joinpoint): Joinpoint[] {
    if (startingPoint) {
        return Query.searchFrom(startingPoint, Joinpoint).get().filter(jp => jp.hasType && jp.type !== null && jp.type !== undefined)
    }
    return Query.search(Joinpoint).get().filter(jp => 
        jp.hasType && 
        jp.type !== null && 
        jp.type !== undefined);
}

/**
 * Checks if a given joinpoint uses the specified tag declaration
 * @param $jp The joinpoint to analyze
 * @param tag The tag to check against
 * @returns Returns true if the joinpoint uses the given tag, false otherwise
 */
export function isTagUsed($jp: Joinpoint, tag: RecordJp | EnumDecl): boolean {
    const jpType = getBaseType($jp);
    return jpType instanceof ElaboratedType && 
        jpType.namedType instanceof TagType && 
        jpType.namedType.decl.astId === tag.astId &&
        $jp.astId !== getTypeDecl(tag)?.astId
}

/**
 * Retrieves all joinpoints that use the specified tag declaration
 * 
 * @param tag The tag to search for in the joinpoints
 * @returns Array of joinpoints that use the specified tag declaration
 */
export function getTagUses(tag: RecordJp | EnumDecl): Joinpoint[] {
    return getTypedJps().filter(jp => isTagUsed(jp, tag));
}

/**
 * Retrieves the last statement of the given case
 * @param $jp - The case to retrieve the last statement from
 * @returns The last statement of the case or undefined if there are no statements or it has a consecutive case.
 */
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

/**
 * Retrieves the number of switch clauses with instructions in the provided switch statement
 * @param $jp - The switch statement to analyze
 * @returns The number of switch clauses with instructions
 */
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

/**
 * Checks if the provided switch statement has a Boolean condition
 * @param switchStmt - The switch statement to check
 * @returns 
 * Returns true if the switch statement has a Boolean condition, otherwise false
 */
export function switchHasBooleanCondition(switchStmt: Switch): boolean {
    return switchStmt.condition instanceof BinaryOp ||
            (hasDefinedType(switchStmt.condition) &&
             switchStmt.condition.type instanceof BuiltinType &&
              switchStmt.condition.type.builtinKind === "Bool"
            );
}

/**
 * Checks if the provided switch statement contains any conditional break
 * @param switchStmt - The switch statement to analyze
 * @returns Returns true if the switch statement contains a conditional break, otherwise false
 */
export function switchHasConditionalBreak(switchStmt: Switch): boolean {
    return Query.searchFrom(switchStmt, Break, { currentRegion: region => region.astId !== switchStmt.astId, enclosingStmt: jp => jp.astId === switchStmt.astId }).get().length > 0;
}