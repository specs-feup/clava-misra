import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import Context from "./ast-visitor/Context.js";
import VisitWithContext from "./ast-visitor/VisitWithContext.js";

/**
 * Represents a standard guideline that detects and corrects violations in the code according to a particular coding standard.
 * 
 * Need to implement/define:
 *  - initialValue()
 *  - match($jp, logErrors)
 *  - apply($jp)
 */
export default abstract class StandardGuideline<T,C extends Context<T> = Context<T>> extends VisitWithContext<T, C> {

    /**
     * Checks if the joinpoint violates the guideline
     * 
     * @param $jp - Joinpoint to analyze
     * @param logErrors - [logErrors=false] - Whether to log errors if a violation is detected
     * @returns Returns true if the joinpoint violates the guideline, false otherwise
     */
    abstract match($jp: Joinpoint, logErrors: boolean): boolean;
}
