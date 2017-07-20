import {min, max, range, extent} from "d3-array";
import {axisLeft, axisBottom} from "d3-axis";
import {format} from "d3-format";
import {scaleLinear, scaleSequential, scaleBand, interpolateViridis, interpolateInferno, interpolateMagma, interpolatePlasma} from "d3-scale";
import * as scaleChromatic from "d3-scale-chromatic";
import {selection, select, selectAll} from "d3-selection";
import {transition} from "d3-transition";

// assemble minimal D3 with chromatic color scales
// and color schemes for all included color scales

let d3 = Object.assign(
    {},
    {min},
    {max},
    {range},
    {extent},
    {axisLeft},
    {axisBottom},
    {format},
    {scaleLinear},
    {scaleSequential},
    {scaleBand},
    {selection},
    {select},
    {selectAll},
    {transition},
    {interpolateViridis},
    {interpolateInferno},
    {interpolateMagma},
    {interpolatePlasma}
);

// add interpolations and color schemes for chromatic scales
let sequentialChromatics = Object.keys(scaleChromatic)
    .filter(s => s.startsWith("interpolate"))
    .map(s => s.replace("interpolate", ""));

sequentialChromatics
    .map(s => {
        d3[`interpolate${s}`] = scaleChromatic[`interpolate${s}`];
        d3[`palette${s}`] = d3.range(0, 1.01, 0.01)
            .map(x => d3.scaleSequential(d3[`interpolate${s}`])(x));
    });

// create and add schemes for other (included) colors
["Viridis", "Inferno", "Magma", "Plasma"]
    .map(c => {
        d3[`palette${c}`] = d3.range(0, 1.01, 0.01)
            .map(x => d3.scaleSequential(d3[`interpolate${c}`])(x));
    });

export default d3;
