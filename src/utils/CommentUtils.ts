import { Joinpoint, WrapperStmt, Comment } from "@specs-feup/clava/api/Joinpoints.js";

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