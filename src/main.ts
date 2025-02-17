import Query from "@specs-feup/lara/api/weaver/Query.js";
import VisualizationTool from "@specs-feup/clava-visualization/api/VisualizationTool.js";
import MISRATool from "./misra/MISRATool.js";

const misraTool = new MISRATool();
misraTool.analyse();


//await VisualizationTool.visualize();
