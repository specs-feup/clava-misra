import { LaraJoinPoint } from "@specs-feup/lara/api/LaraJoinPoint.js";

export default abstract class Visit {
    abstract apply($jp: LaraJoinPoint): unknown;

    getDependencies(): Visit[] {
        return [];
    }
}