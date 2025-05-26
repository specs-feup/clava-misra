import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";
import Context from "./Context.js";
import Visit from "./Visit.js";

/**
 * Visit with a shared context to enable communication between visits 
 * 
 * Need to implement:
 * - apply($jp)
 * - initialValue()
 */
export default abstract class VisitWithContext<T, C extends Context<T> = Context<T>> extends Visit {
    protected context: C;

    /**
     * @param context Shared context object
     */
    constructor(context: C) {
        super();
        this.context = context;
        this.context.put(this.name, this.initialValue());
    }

    /**
     * @return Visit name, defaults to class name
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * @returns Initial value stored in the shared context
     */
    abstract initialValue(): T;

    /**
     * Applies the transformation to the given node
     * @param $jp The node to transform
     * @returns Transformation result
     */
    abstract apply($jp: LaraJoinPoint): unknown;
}