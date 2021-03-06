/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by Nadieh Bremer ////////////////
////////////////// VisualCinnamon.com ///////////////////
/////////// Inspired by the code of alangrafu ///////////
/////////////////////////////////////////////////////////
/// Converted to D3.v4 & modified by Mark van Dijken ////
/////////////////////////////////////////////////////////

function RadarChart(id, data, cfg) {

	//If the supplied maxValue is smaller than the actual one, replace by the max in the data
	const maxValue = Math.max(cfg.maxValue, d3.max(data, i => d3.max(i.map(o => o.value))));

	const allAxis = (data[0].map((i, j) => i.axis)),	//Names of each axis
		total = allAxis.length,					//The number of different axes
		radius = Math.min(cfg.w/2, cfg.h/2), 	//Radius of the outermost circle
		Format = d3.format('.2f'),			 	//formatting function
		angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

	//Scale for the radius
	const rScale = d3.scaleLinear()
		.range([0, radius])
		.domain([0, 25]);

	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////

	//Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();

	//Initiate the radar chart SVG
	const svg = d3.select(id).append("svg")
			.attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
			.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
			.attr("class", "radar"+id);
	//Append a g element
	const g = svg.append("g")
			.attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");


	/////////////////////////////////////////////////////////
	/////////////// Draw the Circular grid //////////////////
	/////////////////////////////////////////////////////////

	//Wrapper for the grid & axes
	const axisGrid = g.append("g").attr("class", "axisWrapper");

	//Draw the background circles
	axisGrid.selectAll(".levels")
		.data(d3.range(1,(cfg.levels+1)).reverse())
		.enter()
		.append("circle")
		.attr("class", "gridCircle")
		.attr("r", (d, i) => radius/cfg.levels*d)
		.style("stroke", "#CDCDCD")
		.style("fill-opacity", 0);

	//Text indicating at what % each level is
	axisGrid.selectAll(".axisLabel")
		.data(d3.range(1,(cfg.levels+1)).reverse())
		.enter().append("text")
		.attr("class", "axisLabel")
		.attr("x", 4)
		.attr("y", (d) => -d*radius/cfg.levels)
		.attr("dy", "0.4em")
		.style("font-size", "10px")
		.attr("fill", "#737373")
		.text((d,i) => Format(maxValue * d/cfg.levels));

	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////

	//Create the straight lines radiating outward from the center
	const axis = axisGrid.selectAll(".axis")
		.data(allAxis)
		.enter()
		.append("g")
		.attr("class", "axis");
	//Append the lines
	axis.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", (d, i) => rScale(maxValue) * Math.cos(angleSlice*i - Math.PI/2))
		.attr("y2", (d, i) => rScale(maxValue) * Math.sin(angleSlice*i - Math.PI/2))
		.attr("class", "line")
		.style("stroke", "#CDCDCD")
		.style("stroke-width", "1px")
		.style("shape-rendering", "geometricPrecision");

	//Append the labels at each axis
	axis.append("text")
		.attr("class", "legend")
		.style("font-size", "11px")
		.attr("text-anchor", "middle")
		.attr("dy", "0.35em")
		.attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2))
		.attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2))
		.text(d => d)
		.call(wrap, cfg.wrapWidth);

	/////////////////////////////////////////////////////////
	////////////////////// Area Legend //////////////////////
	/////////////////////////////////////////////////////////
	const areaLegend = svg.append('g');

	areaLegend.append('text')
						.attr('fill', 'black')
						.attr('text-anchor', 'start')
						.attr('x', 460)
						.attr('y', 11)
						.attr('font-size', '11')
						.attr('font-family', 'Arial')
						.text('Average fraud check score of fraudulent transactions');

	areaLegend.append('rect')
						.attr('fill', cfg.color(0))
						.attr('x', 438)
						.attr('y', 0)
						.attr('width', '1em')
						.attr('height', '1em')
						.attr('opacity', '1');

	areaLegend.append('text')
						.attr('fill', 'black')
						.attr('text-anchor', 'start')
						.attr('x', 460)
						.attr('y', 32)
						.attr('font-size', '11')
						.attr('font-family', 'Arial')
						.text('Average fraud check score of all transactions');

	areaLegend.append('rect')
						.attr('fill', cfg.color(1))
						.attr('x', 438)
						.attr('y', 20)
						.attr('width', '1em')
						.attr('height', '1em')
						.attr('opacity', '1');


	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////

	//The radial line function
	const radarLine = d3.radialLine()
		.radius(d => rScale(d.value))
		.angle((d,i) => i*angleSlice)
    .curve(d3.curveLinearClosed)

	//Create a wrapper for the blobs
	const blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarWrapper");

	//Append the backgrounds
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
		.attr("d", (d,i) => radarLine(d))
		.style("fill", (d,i) => cfg.color(i))
		.style("fill-opacity", cfg.opacityArea)
		.on('mouseover', function (d,i){
			//Dim all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0);
			//Bring back the hovered over blob
			d3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0.80);
		})
		.on('mouseout', function(){
			//Bring back all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});

	//Create the outlines
	blobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", (d,i) => radarLine(d))
		.style("stroke-width", cfg.strokeWidth + "px")
		.style("stroke", (d,i) => cfg.color(i))
		.style("fill", "none");

	//Append the circles
	blobWrapper.selectAll(".radarCircle")
		.data((d,i) => d)
		.enter().append("circle")
		.attr("class", "radarCircle")
		.attr("r", cfg.dotRadius)
		.attr("cx", (d,i) => rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2))
		.attr("cy", (d,i) => rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2))
		.style("fill", (d,i,j) => d.name === 'all' ? cfg.color(1) : cfg.color(0))
		.style("fill-opacity", cfg.opacityCircles);

	/////////////////////////////////////////////////////////
	//////// Append invisible circles for tooltip ///////////
	/////////////////////////////////////////////////////////

	//Wrapper for the invisible circles on top
	const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarCircleWrapper");

	//Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle")
		.data((d,i) => d)
		.enter().append("circle")
		.attr("class", "radarInvisibleCircle")
		.attr("r", cfg.dotRadius*1.5)
		.attr("cx", (d,i) => rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2))
		.attr("cy", (d,i) => rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2))
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mouseover", function(d,i) {
			newX =  parseFloat(d3.select(this).attr('cx')) - 10;
			newY =  parseFloat(d3.select(this).attr('cy')) - 10;
			tooltip
				.attr('x', newX)
				.attr('y', newY)
				.text(Format(d.value))
				.transition().duration(200)
				.style('opacity', 1);
		})
		.on("mouseout", function(){
			tooltip.transition().duration(200)
				.style("opacity", 0);
		});

	//Set up the small tooltip for when you hover over a circle
	const tooltip = g.append("text")
		.attr("class", "tooltip")
		.style("opacity", 0);

	/////////////////////////////////////////////////////////
	/////////////////// Helper Function /////////////////////
	/////////////////////////////////////////////////////////

	//Taken from http://bl.ocks.org/mbostock/7555321
	//Wraps SVG text
	function wrap(text, width) {
	  text.each(function() {
			let text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 0,
				lineHeight = 1.4, // ems
				y = text.attr("y"),
				x = text.attr("x"),
				dy = parseFloat(text.attr("dy")),
				tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

			while (word = words.pop()) {
			  line.push(word);
			  tspan.text(line.join(" "));
			  if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				tspan.text(line.join(" "));
				line = [word];
				tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
			  }
			}
	  });
	}//wrap

}//RadarChart
