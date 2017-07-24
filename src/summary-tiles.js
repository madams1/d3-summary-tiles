import d3 from "./mini-d3";

export default function() {

        let data,
            xTickLabs,
            yTickLabs,
            xNum,
            yNum,
            hm,
            xAxis,
            yAxis,
            colorScale,
            fillDomain,
            initialFillDomain,
            palette,
            xTicks,
            yTicks,
            width,
            height,
            tiles,
            dataRects,
            legendGroup,
            legendScale,
            legendIndicator,
            // updating functions
            updateData,
            updateTitle,
            // getters/setters
            x,
            y,
            fill,
            tileWidth,
            tileHeight,
            title = "",
            titleSize = 20,
            tickLabelSize = 12,
            horizontalPadding = 100,
            xLabel = null,
            rotateXTicks = false,
            flipYAxis = false,
            yLabel = null,
            legendTitle = null,
            showLegend = true,
            showLegendIndicator = true,
            verticalLegend = false,
            showXTicks = true,
            showYTicks = true,
            colorScheme = "YlOrBr",
            reverseColorScale = false,
            strokeColor = "#fff",
            fontColor = "#333",
            unselectedColor = "#ccc",
            highlightColor = "#333",
            nullColor = "#bdbdbd",
            onClick = null,
            showTooltip = true,
            tooltipWidth = 180,
            wrapTooltip = false,
            noNullTooltips = false,
            pairwiseJoinText = " \u2014 ",
            numberFormat = ",";

        // move DOM node to front
        d3.selection.prototype.moveToFront = function() {
            return this.each(function() {
              this.parentNode.appendChild(this);
            });
        };

        const legDim = [150, 15];

        const margin = {
            top: 10,
            bottom: 25,
            left: horizontalPadding * 2,
            right: 0
        };

        function exports(_selection) {
            _selection.each(function() {
                // initial setup and drawing
                processData(data);
                buildSVG(this);
                buildAxes();
                drawAxes();
                drawTitle();
                buildColorScales();
                buildTileArea();
                drawTiles();
                createTileMouseEvents();
                if (showLegend) {
                    buildLegendArea();
                    scaleLegend();
                    verticalLegend ? drawVerticalLegend() : drawHorizontalLegend();
                }
                // what to do after getting new data
                updateData = function() {
                    buildColorScales();
                    drawTitle();
                    drawTiles();
                    blockTileMouseEvents();
                    if (showLegend) {
                        scaleLegend();
                        verticalLegend ? drawVerticalLegendNumbers() : drawHorizontalLegendNumbers();
                    }
                };
            });
        }

        function processData(_data) {
            // get unique x and y values to create labels
            xTickLabs = [...new Set(_data.map(d => d[x]))];
            yTickLabs = [...new Set(_data.map(d => d[y]))];

            xNum = xTickLabs.length;
            yNum = yTickLabs.length;

            width = xNum * tileWidth + margin.left + margin.right;
            height = yNum * tileHeight + margin.top + margin.bottom;

            // add x and y indexes to data to order/layout tiles
            let xRef = [];
            xTickLabs.forEach( (d, i) => {
                let ref = {xIndex: i};
                ref[x] = d;

                xRef.push(ref);
            });

            let yRef = [];
            yTickLabs.forEach( (d, i) => {
                let ref = {yIndex: flipYAxis ? (yNum - 1 - i) : i};
                ref[y] = d;

                yRef.push(ref);
            });

            // add these index references to the data
            data = _data.map(d => {
                let indexedData = Object.assign(
                    d,
                    xRef.find(i => i[x] === d[x]),
                    yRef.find(i => i[y] === d[y])
                );
                return indexedData;
            });
        }

        function buildSVG(container) {
            hm = d3.select(container)
                .style("width", width + (verticalLegend ? 50 : 0))
                .append("svg")
                .attr("width", width + (verticalLegend ? 50 : 0))
                .attr("height", rotateXTicks ? (height + 230) : (height + 110))
                .append("g")
                .attr("transform", `translate(${-(margin.left/2 - margin.right)}, ${margin.bottom * 2})`);
        }

        function buildAxes() {

            let yScale = d3.scaleBand()
                .domain(flipYAxis ? yTickLabs.reverse() : yTickLabs)
                .range([0, (height - margin.top - margin.bottom)]);

            yAxis = d3.axisLeft(yScale);

            let xScale = d3.scaleBand()
                .domain(xTickLabs)
                .range([0, (width - margin.left - margin.right)]);

            xAxis = d3.axisBottom(xScale);
        }

        function drawAxes() {
            hm.append("g")
                .classed("y axis", true)
                .attr("transform", `translate(${margin.left}, 0)`)
                .call(yAxis)
                .append("text")
                .attr("transform", "translate(-10, 0)")
                .attr("text-anchor", "end")
                .text(yLabel !== null ? yLabel : y)
                .attr("fill", fontColor)
                .style("font-size", "14px")
                .style("font-weight", 600);

            hm.append("g")
                .classed("x axis", true)
                .attr("transform", `translate(${margin.left}, ${height - margin.bottom - margin.top})`)
                .call(xAxis)
                .append("text")
                .attr("transform", `translate(${(width - margin.left - margin.right) / 2}, ${margin.bottom * 2})`)
                .attr("text-anchor", "middle")
                .text(xLabel !== null ? xLabel : x)
                .attr("fill", fontColor)
                .style("font-size", "14px")
                .style("font-weight", 600)
                .classed("xLabel", true);

            // don't show axis lines
            d3.selectAll(".axis path, .axis line")
                .attr("stroke", "none")
                .style("fill", "none");

            if (rotateXTicks) {
                d3.selectAll(".x .tick text")
                    .style("text-anchor", "end")
                    .attr("transform", "rotate(-90)translate(-5, -13)");

                d3.select(".xLabel").remove();
            }
        }

        function drawTitle() {
            d3.select("#st-title").remove();
            hm.append("text")
                .attr("transform", `translate(${(width + margin.left - margin.right) / 2}, ${-margin.bottom})`)
                .attr("text-anchor", "middle")
                .text(title)
                .style("font-size", titleSize)
                .style("font-weight", 800)
                .attr("fill", fontColor)
                .attr("id", "st-title")
                .style("opacity", 0)
                .transition()
                .duration(500)
                .style("opacity", 1);
        }

        updateTitle = function() {
            d3.select("#st-title")
                .text(title);
        }

        function buildColorScales() {
            let colorInterpolator = d3[`interpolate${colorScheme}`];

            fillDomain = initialFillDomain ? initialFillDomain : d3.extent(data.map(d => d[fill]));

            colorScale = d3.scaleSequential(colorInterpolator)
                .domain(reverseColorScale ? fillDomain.reverse() : fillDomain);

            palette = d3[`palette${colorScheme}`];
        }

        function buildTileArea() {
            xTicks = d3.selectAll(".x .tick");
            yTicks = d3.selectAll(".y .tick");

            if (!showXTicks) {
                d3.selectAll(xTicks.nodes())
                    .selectAll("text")
                    .style("opacity", 0);
            }

            if (!showYTicks) {
                d3.selectAll(yTicks.nodes())
                    .selectAll("text")
                    .style("opacity", 0);
            }

            d3.selectAll(xTicks.nodes())
                .selectAll("text")
                .style("font-size", tickLabelSize)
                .attr("fill", fontColor);

            d3.selectAll(yTicks.nodes())
                .selectAll("text")
                .style("font-size", tickLabelSize)
                .attr("fill", fontColor);

            hm.append("g")
                .classed("tiles", true);
        }

        function drawTiles() {

            // place tiles on chart
            dataRects = d3.select(".tiles").selectAll("rect").data(data);

            tiles = dataRects.enter().append("rect")
                .attr("x", d => tileWidth * (d.xIndex) + margin.left)
                .attr("y", d => (tileHeight) * (d.yIndex))
                .attr("rx", 1)
                .attr("ry", 1)
                .attr("width", tileWidth)
                .attr("height", tileHeight);

            tiles.exit().remove();

            tiles.style("stroke", strokeColor)
                .attr("stroke-width", 1.5)
                .style("fill", d => d[fill] === null ? nullColor : colorScale(d[fill]))
                .merge(dataRects)
                .transition().duration(800)
                .style("fill", d => d[fill] === null ? nullColor : colorScale(d[fill]));
        }

        function createTileMouseEvents() {

            tiles.on("mouseover", function(d) {

                let thisTile = d3.select(this);

                // change legend indicator position
                if (verticalLegend) {
                    legendIndicator
                        .moveToFront()
                        .transition().duration(200)
                        .style("opacity", typeof(d[fill]) === "number" ? 1 : 0)
                        .attr("cy", (margin.top + 20 + 9 + legendScale(d[fill])));
                } else {
                    legendIndicator
                        .moveToFront()
                        .transition().duration(200)
                        .style("opacity", typeof(d[fill]) === "number" ? 1 : 0)
                        .attr("cx", (margin.left + legendScale(d[fill])));
                }

                // highlight this tile
                thisTile
                    .moveToFront()
                    .style("stroke", highlightColor)
                    .attr("stroke-width", 2.5)
                    .transition().duration(100)
                    .attr("height", tileHeight * 0.75)
                    .transition().duration(100)
                    .attr("height", tileHeight);

                // helper for getting symmetric difference in tick labels
                const symDiff = (arr1, arr2) => {
                    return arr1.filter(ele => arr2.indexOf(ele) < 0);
                };

                // fade unselected tick labels
                d3.selectAll(symDiff(yTicks.nodes(), [yTicks.nodes()[d.yIndex]]))
                        .selectAll("text")
                        .transition().duration(400)
                        .attr("fill", unselectedColor);

                d3.selectAll(symDiff(xTicks.nodes(), [xTicks.nodes()[d.xIndex]]))
                        .selectAll("text")
                        .transition().duration(400)
                        .attr("fill", unselectedColor);

                // highlight selected tick labels
                d3.select(yTicks.nodes()[d.yIndex])
                    .select("text")
                    .transition().duration(400)
                    .attr("fill", fontColor);

                d3.select(xTicks.nodes()[d.xIndex])
                    .select("text")
                    .transition().duration(400)
                    .attr("fill", fontColor);

                // handle tooltip
                if (showTooltip) {

                    let tooltipHeight = wrapTooltip ? 100 : 60;

                    let tilesHeight = yNum * tileHeight,
                        tilesWidth = xNum * tileWidth;

                    let tooltipBelowPosition = +thisTile.attr("y") + tileHeight + 7 + tooltipHeight,
                        tooltipAbovePosition = +thisTile.attr("y") - 7 - tooltipHeight;

                    let flipTooltipUp = tooltipBelowPosition >= tilesHeight,
                        slideTooltipRight = +thisTile.attr("x") + tileWidth/2 - tooltipWidth/2 <= margin.left,
                        slideTooltipLeft = +thisTile.attr("x") + tileWidth/2 + tooltipWidth/2 - margin.left >= tilesWidth;

                    let slideRightPosition = +thisTile.attr("x") - (+thisTile.attr("x") - margin.left) + 7,
                        slideLeftPosition =  margin.left - tooltipWidth + tilesWidth - 7;
                    let tooltipXPosition = +thisTile.attr("x") - (tooltipWidth - tileWidth)/2;

                    this.tooltipGroup = d3.select(".tiles")
                        .append("g")
                        .classed("tooltipGroup", true)
                        .attr("transform", "translate(" + (slideTooltipRight ? slideRightPosition :
                            (slideTooltipLeft ? slideLeftPosition : tooltipXPosition)) +
                            ", " + (flipTooltipUp ? tooltipAbovePosition : (tooltipBelowPosition - tooltipHeight)) + ")");

                    this.tooltipGroup.append("rect")
                        .attr("width", tooltipWidth)
                        .attr("height", tooltipHeight)
                        .attr("rx", 2)
                        .attr("ry", 2)
                        .style("fill", "#333");

                    if (wrapTooltip) {
                        this.tooltipGroup.append("text")
                            .text(
                              `${(legendTitle ? legendTitle : fill)}: ` +
                              (d[fill] !== null ? d3.format(numberFormat)(d[fill]) : "N/A")
                            )
                            .style("font-size", 14)
                            .style("font-weight", 700)
                            .attr("text-anchor", "middle")
                            .attr("x", tooltipWidth / 2)
                            .attr("y", 22)
                            .attr("fill", "#eee");

                        this.tooltipGroup.append("text")
                            .text(d[y])
                            .style("font-size", 12)
                            .attr("text-anchor", "middle")
                            .attr("x", tooltipWidth/2)
                            .attr("y", tooltipHeight/2)
                            .attr("fill", "#eee");

                        this.tooltipGroup.append("text")
                            .text(pairwiseJoinText)
                            .style("font-size", 11)
                            .attr("text-anchor", "middle")
                            .attr("x", tooltipWidth/2)
                            .attr("y", tooltipHeight/2 + 17)
                            .attr("fill", "#eee");

                        this.tooltipGroup.append("text")
                            .text(d[x])
                            .style("font-size", 12)
                            .attr("text-anchor", "middle")
                            .attr("x", tooltipWidth/2)
                            .attr("y", tooltipHeight/2 + 36)
                            .attr("fill", "#eee");
                    } else {
                        this.tooltipGroup.append("text")
                            .text(
                              `${(legendTitle ? legendTitle : fill)}: ${d3.format(numberFormat)(d[fill])}`
                            )
                            .style("font-size", 14)
                            .style("font-weight", 700)
                            .attr("text-anchor", "middle")
                            .attr("x", tooltipWidth/2)
                            .attr("y", tooltipHeight/2 - 10)
                            .attr("fill", "#eee");

                        this.tooltipGroup.append("text")
                            .text(d[y] + pairwiseJoinText + d[x])
                            .style("font-size", 13)
                            .attr("text-anchor", "middle")
                            .attr("x", tooltipWidth/2)
                            .attr("y", tooltipHeight/2 + 16)
                            .attr("fill", "#eee");
                    }

                    this.tooltipGroup.style("opacity", 0)
                        .transition().delay(200).duration(200)
                        .style("opacity", (d[fill] === null && noNullTooltips) ? 0 : 0.9);

                }

            });

            tiles.on("mouseout", function(d) {
                d3.select(this)
                    .style("stroke", strokeColor)
                    .attr("stroke-width", 1.5);

                if (showTooltip) {
                    this.tooltipGroup.remove();
                }
            });

            tiles.on("click", onClick);

            // return tick labels to default
            d3.select(".tiles")
                .on("mouseleave", function() {
                    d3.selectAll(yTicks.nodes())
                        .selectAll("text")
                        .transition().duration(400)
                        .attr("fill", fontColor);

                    d3.selectAll(xTicks.nodes())
                        .selectAll("text")
                        .transition().duration(400)
                        .attr("fill", fontColor);

                    legendIndicator
                        .transition().duration(200)
                        .style("opacity", 0);

                    d3.select(this).remove();
                    buildTileArea();
                    drawTiles();
                    createTileMouseEvents();
                });

        }

        function blockTileMouseEvents() {

            // used when updating with new data to
            // temporarily block mouse events
            // on the transitioning tiles
            d3.select(".tiles")
                .style("pointer-events", "none");

            setTimeout(
                function() {
                    d3.select(".tiles")
                        .style("pointer-events", "auto");
                },
                800
            );

        }

        function buildLegendArea() {

            legendGroup = hm.append("g")
                .classed("st_legend", true);

            if (showLegendIndicator) {

                legendIndicator = legendGroup.append("circle")
                        .attr("r", 3)
                        .attr("fill", "white")
                        .attr("stroke", "black")
                        .style("opacity", 0);

            }

        }

        function scaleLegend() {

            d3.select(legendIndicator).remove();

            legendScale = d3.scaleLinear()
                .domain(reverseColorScale ? (verticalLegend ? fillDomain : fillDomain.reverse()) : fillDomain)
                .range([0, legDim[0]]);

            if (showLegendIndicator) {

                if (verticalLegend) {
                    legendIndicator
                        .attr("cx", width + 15 + legDim[1]/2)
                        .attr("cy", margin.top + 20 + 9 + legDim[0]/2);
                } else {
                    legendIndicator
                        .attr("cx", margin.left + legDim[0]/2)
                        .attr("cy", rotateXTicks ?
                        (height + margin.bottom + 120 + legDim[1]/2) :
                        (height + margin.bottom + legDim[1]/2));
                }
            }
        }

        function drawVerticalLegendNumbers() {

            d3.selectAll(".st-legend-number")
                .remove();

            legendGroup.append("text")
                .attr("text-anchor", "start")
                .text(d3.format(numberFormat)(d3.max(fillDomain)))
                .attr("x", width + 33)
                .attr("y", margin.top + 15 + 20)
                .style("font-size", "11px")
                .style("opacity", 0)
                .attr("fill", fontColor)
                .classed("st-legend-number", true)
                .transition()
                .duration(500)
                .style("opacity", 1);

            legendGroup.append("text")
                .attr("text-anchor", "start")
                .text(d3.format(numberFormat)(d3.min(fillDomain)))
                .attr("x", width + 33)
                .attr("y", margin.top + legDim[0] + 9 + 20)
                .style("font-size", "11px")
                .style("opacity", 0)
                .attr("fill", fontColor)
                .classed("st-legend-number", true)
                .transition()
                .duration(500)
                .style("opacity", 1);

        }

        function drawVerticalLegend() {

            let legend = legendGroup.append("defs")
                    .append("linearGradient")
                    .attr("id", "st_gradient")
                    .attr("x1", 0)
                    .attr("x2", 0)
                    .attr("y1", 1)
                    .attr("y2", 0);

                (reverseColorScale ? palette.reverse() : palette).forEach( (c, i) => {
                    legend.append("stop")
                        .attr("offset", i / (palette.length - 1))
                        .attr("stop-color", c)
                });

                legendGroup.append("rect")
                    .attr("x", width + 15)
                    .attr("y", margin.top + 9 + 20)
                    .attr("width", legDim[1])
                    .attr("height", legDim[0])
                    .attr("fill", "url(#st_gradient)");

                legendGroup.append("text")
                    .attr("text-anchor", "start")
                    .text(legendTitle ? legendTitle : fill)
                    .attr("x", width + 10)
                    .attr("y", margin.top + 20)
                    .style("font-size", "12px")
                    .style("font-weight", "600")
                    .attr("fill", fontColor);

                drawVerticalLegendNumbers();
        }

        function drawHorizontalLegendNumbers() {

            d3.selectAll(".st-legend-number")
                .remove();

            legendGroup.append("text")
                .attr("text-anchor", "middle")
                .text(d3.format(numberFormat)(d3.min(fillDomain)))
                .attr("x", margin.left)
                .attr("y", rotateXTicks ?
                    (height + margin.bottom + 28 + 120) :
                    (height + margin.bottom + 28))
                .style("font-size", "11px")
                .style("opacity", 0)
                .attr("fill", fontColor)
                .classed("st-legend-number", true)
                .transition()
                .duration(500)
                .style("opacity", 1);

            legendGroup.append("text")
                .attr("text-anchor", "middle")
                .text(d3.format(numberFormat)(d3.max(fillDomain)))
                .attr("x", margin.left + legDim[0])
                .attr("y", rotateXTicks ?
                    (height + margin.bottom + 28 + 120) :
                    (height + margin.bottom + 28))
                .style("font-size", "11px")
                .style("opacity", 0)
                .attr("fill", fontColor)
                .classed("st-legend-number", true)
                .transition()
                .duration(500)
                .style("opacity", 1);

        }

        function drawHorizontalLegend() {

            let legend = legendGroup.append("defs")
                .append("linearGradient")
                .attr("id", "st_gradient");

            (reverseColorScale ? palette.reverse() : palette).forEach( (c, i) => {
                legend.append("stop")
                    .attr("offset", i / (palette.length - 1))
                    .attr("stop-color", c)
            });

            legendGroup.append("rect")
                .attr("x", margin.left)
                .attr("y", rotateXTicks ?
                    (height + margin.bottom + 120) :
                    (height + margin.bottom))
                .attr("width", legDim[0])
                .attr("height", legDim[1])
                .attr("fill", "url(#st_gradient)");

            legendGroup.append("text")
                .attr("text-anchor", "start")
                .text(legendTitle ? legendTitle : fill)
                .attr("x", margin.left)
                .attr("y", rotateXTicks ?
                    (height + margin.bottom - 7 + 120) :
                    (height + margin.bottom - 7))
                .style("font-size", "12px")
                .style("font-weight", "600")
                .attr("fill", fontColor);

            drawHorizontalLegendNumbers();
        }

        // API methods - get or set properties

        exports.data = function(_) {
            if (!arguments.length) {
                return data;
            }
            processData(_);
            if (typeof updateData === 'function') updateData();
            return this;
        };

        exports.x = function(_) {
            if (!arguments.length) {
                return x;
            }
            x = _;

            return this;
        };

        exports.y = function(_) {
            if (!arguments.length) {
                return y;
            }
            y = _;

            return this;
        };

        exports.fill = function(_) {
            if (!arguments.length) {
                return fill;
            }
            fill = _;

            return this;
        };

        exports.tileWidth = function(_) {
            if (!arguments.length) {
                return tileWidth;
            }
            tileWidth = _;

            return this;
        };

        exports.tileHeight = function(_) {
            if (!arguments.length) {
                return tileHeight;
            }
            tileHeight = _;

            return this;
        };

        exports.fillDomain = function(_) {
            if (!arguments.length) {
                return initialFillDomain;
            }
            initialFillDomain = _;

            return this;
        };

        exports.title = function(_) {
            if (!arguments.length) {
                return title;
            }
            title = _;
            if (typeof updateTitle === "function") updateTitle();
            return this;
        };

        exports.titleSize = function(_) {
            if (!arguments.length) {
                return titleSize;
            }
            titleSize = _;

            return this;
        };

        exports.tickLabelSize = function(_) {
            if (!arguments.length) {
                return tickLabelSize;
            }
            tickLabelSize = _;

            return this;
        };

        exports.horizontalPadding = function(_) {
            if (!arguments.length) {
                return horizontalPadding;
            }
            margin.left = _ * 2;

            return this;
        };

        exports.xLabel = function(_) {
            if (!arguments.length) {
                return xLabel;
            }
            xLabel = _;

            return this;
        };

        exports.yLabel = function(_) {
            if (!arguments.length) {
                return yLabel;
            }
            yLabel = _;

            return this;
        };

        exports.rotateXTicks = function() {

            rotateXTicks = true;

            return this;
        };

        exports.flipYAxis = function() {

            flipYAxis = true;

            return this;
        };

        exports.legendTitle = function(_) {
            if (!arguments.length) {
                return legendTitle;
            }
            legendTitle = _;

            return this;
        };

        exports.noLegend = function() {

            showLegend = false;

            return this;
        };

        exports.noLegendIndicator = function() {

            showLegendIndicator = false;

            return this;
        };

        exports.verticalLegend = function() {

            verticalLegend = true;

            return this;
        };

        exports.noXTicks = function() {

            showXTicks = false;

            return this;
        };

        exports.noYTicks = function() {

            showYTicks = false;

            return this;
        };

        exports.colorScheme = function(_) {
            if (!arguments.length) {
                return colorScheme;
            }
            colorScheme = _;

            return this;
        };

        exports.reverseColorScale = function() {

            reverseColorScale = true;

            return this;
        };

        exports.strokeColor = function(_) {
            if (!arguments.length) {
                return strokeColor;
            }
            strokeColor = _;

            return this;
        };

        exports.fontColor = function(_) {
            if (!arguments.length) {
                return fontColor;
            }
            fontColor = _;

            return this;
        };

        exports.highlightColor = function(_) {
            if (!arguments.length) {
                return highlightColor;
            }
            highlightColor = _;

            return this;
        };

        exports.unselectedColor = function(_) {
            if (!arguments.length) {
                return unselectedColor;
            }
            unselectedColor = _;

            return this;
        };

        exports.nullColor = function(_) {
            if (!arguments.length) {
                return nullColor;
            }
            nullColor = _;

            return this;
        };

        exports.onClick = function(_) {
            if (!arguments.length) {
                return onClick;
            }
            onClick = _;

            return this;
        };

        exports.noTooltip = function() {

            showTooltip = false;

            return this;
        };

        exports.tooltipWidth = function(_) {
            if (!arguments.length) {
                return tooltipWidth;
            }
            tooltipWidth = _;

            return this;
        };

        exports.wrapTooltip = function() {

            wrapTooltip = true;

            return this;
        };

        exports.noNullTooltips = function() {

            noNullTooltips = true;

            return this;
        };

        exports.pairwiseJoinText = function(_) {
            if (!arguments.length) {
                return pairwiseJoinText;
            }
            pairwiseJoinText = _;

            return this;
        };

        exports.numberFormat = function(_) {
            if (!arguments.length) {
                return numberFormat;
            }
            numberFormat = _;

            return this;
        };

        return exports;

};
