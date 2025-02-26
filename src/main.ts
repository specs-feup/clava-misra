import Query from "@specs-feup/lara/api/weaver/Query.js";
import VisualizationTool from "@specs-feup/clava-visualization/api/VisualizationTool.js";
import MISRATool from "./misra-new/MISRATool.js";

const misraTool = new MISRATool();
misraTool.applyCorrections();


//await VisualizationTool.visualize();
