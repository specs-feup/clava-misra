import { Joinpoint, TypedefNameDecl } from "clava-js/api/Joinpoints.js";
import MISRAPass from "./MISRAPass.js";
import Query from "lara-js/api/weaver/Query.js";

export enum PreprocessingReqs {
    TYPEDEF_DECLS = "typedefDecls"
}

export interface Preprocessing {
    typedefDecls?: TypedefNameDecl[];
}

export default class MISRAReporter {
    private _preprocessing: Preprocessing = {};
    private _preprocessingMapper: Map<PreprocessingReqs, () => void> = new Map([
        [PreprocessingReqs.TYPEDEF_DECLS, this.initTypedefs.bind(this)]
    ]);

    private initTypedefs(): void {
        this._preprocessing.typedefDecls = Query.search(TypedefNameDecl).get();
    }

    applyPass($pass: MISRAPass, $jp: Joinpoint) {
        $pass.preprocessingReqs.forEach($req => {
            if (!this._preprocessing[$req]) {
                (this._preprocessingMapper.get($req) as () => void)();
            }
        });

        $pass.setPreprocessing(this._preprocessing);
        $pass.apply($jp);
    }
}