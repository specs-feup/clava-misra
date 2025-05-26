import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";

/**
 * Common interface for AST transformations applied to a single node
 * 
 * Need to implement:
 * - apply($jp)
 * 
 * @template T Type of data stored in the shared context
 * @template C Type of the context (default is Context<T>)
 */
export default abstract class Visit {
    /**
     * Applies the transformation to the given node
     * @param $jp The node to transform
     * @returns Transformation result
     */
    abstract apply($jp: LaraJoinPoint): unknown;

    /**
     * @returns List of dependent visits, which is empty by default
     */
    get dependencies(): Visit[] {
        return [];
    }
}