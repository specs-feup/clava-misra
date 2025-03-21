import VisualizationTool from "@specs-feup/clava-visualization/api/VisualizationTool.js";
import MISRATool from "./misra-new/MISRATool.js";

MISRATool.checkCompliance();
MISRATool.applyCorrections();

//await VisualizationTool.visualize();
