import Query from "@specs-feup/lara/api/weaver/Query.js";
import { Comment, Joinpoint, TypedefNameDecl, StorageClass, FunctionJp, Vardecl, FileJp } from "@specs-feup/clava/api/Joinpoints.js";

export function isInlineComment($comment: Comment): boolean {
    return $comment.astName === "InlineComment";
}

export function getComments($jp: Joinpoint): Comment[] {
    return $jp instanceof Comment ? [$jp] : $jp.inlineComments;
}

export function astContainsNode($jp: Joinpoint): boolean {
    return (Query.root() as Joinpoint).contains($jp);
}

export function getTypedefs(): TypedefNameDecl[] {
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