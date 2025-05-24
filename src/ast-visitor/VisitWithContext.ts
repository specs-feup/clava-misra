import Context from "./Context.js";
import Visit from "./Visit.js";

export default abstract class VisitWithContext<T, C extends Context<T> = Context<T>> extends Visit {
    protected context: C;

    constructor(context: C) {
        super();
        this.context = context;
        context.put(this.name, this.initialValue());
    }

    get name(): string {
        return this.constructor.name;
    }

    abstract initialValue(): T;
}