import { FileJp, FunctionJp, Joinpoint, StorageClass, TypedefNameDecl, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";
import MISRAPass from "./MISRAPass.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import PassResult from "@specs-feup/lara/api/lara/pass/results/PassResult.js";
import AggregatePassResult from "@specs-feup/lara/api/lara/pass/results/AggregatePassResult.js";
import MISRAPassResult from "./MISRAPassResult.js";

export enum PreprocessingReqs {
    TYPEDEF_DECLS = "typedefDecls",
    EXTERNAL_LINKAGE_DECLS = "externalLinkageDecls"
}

export interface Preprocessing {
    typedefDecls?: TypedefNameDecl[],
    externalLinkageDecls?: (FunctionJp | Vardecl)[]
}

export default class MISRAReporter {
    private _preprocessing: Preprocessing = {};
    private _preprocessingMapper: Map<PreprocessingReqs, () => void> = new Map([
        [PreprocessingReqs.TYPEDEF_DECLS, this.initTypedefs.bind(this)],
        [PreprocessingReqs.EXTERNAL_LINKAGE_DECLS, this.initExternals.bind(this)]
    ]);

    private initTypedefs(): void {
        this._preprocessing.typedefDecls = Query.search(TypedefNameDecl).get();
    }

    private static hasExternalLinkage($class: StorageClass) {
        return $class !== StorageClass.STATIC && $class !== StorageClass.EXTERN;
    }

    private initExternals(): void {
        this._preprocessing.externalLinkageDecls = [];
        Query.search(FileJp).get().forEach(file => {
            file.children.forEach(child => {
                if ((child instanceof Vardecl || child instanceof FunctionJp) && MISRAReporter.hasExternalLinkage(child.storageClass)) {
                    this._preprocessing.externalLinkageDecls?.push(child);
                }
            }, this);
        }, this);
    }

    applyPass($pass: MISRAPass, $jp: Joinpoint): AggregatePassResult | undefined {
        $pass.preprocessingReqs.forEach($req => {
            if (!this._preprocessing[$req]) {
                (this._preprocessingMapper.get($req) as () => void)();
            }
        });

        $pass.setPreprocessing(this._preprocessing);
        const result = $pass.apply($jp) as AggregatePassResult;
        if ((result.results as MISRAPassResult[]).some(res => res.reports.length > 0)) {
            return result;
        }
    }
}