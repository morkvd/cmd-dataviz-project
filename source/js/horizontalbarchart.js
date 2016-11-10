function drawHorizontalBarChart(element, data) {

  console.log(data[0]);

  /////////////////////////////////////////////////////////////
  ///////////////// Set-up SVG and wrappers ///////////////////
  /////////////////////////////////////////////////////////////

  //Added only for the mouse wheel
  var zoomer = d3.zoom()
    .on("zoom", null);

  const main_margin = {top: 10, right: 10, bottom: 30, left: 40},
        main_width = 600 - main_margin.left - main_margin.right,
        main_height = 700 - main_margin.top - main_margin.bottom;

  const mini_margin = {top: 10, right: 10, bottom: 30, left: 10},
        mini_height = 700 - mini_margin.top - mini_margin.bottom;
        mini_width = 100 - mini_margin.left - mini_margin.right;

  const svg = d3.select(element).append("svg")
    .attr("class", "svgWrapper")
    .attr("width", main_width + main_margin.left + main_margin.right + mini_width + mini_margin.left + mini_margin.right)
    .attr("height", main_height + main_margin.top + main_margin.bottom)
    .call(zoomer)
    .on("wheel.zoom", scroll)
    //.on("mousewheel.zoom", scroll)
    //.on("DOMMouseScroll.zoom", scroll)
    //.on("MozMousePixelScroll.zoom", scroll)
    //Is this needed?
    .on("mousedown.zoom", null)
    .on("touchstart.zoom", null)
    .on("touchmove.zoom", null)
    .on("touchend.zoom", null);

  const mainGroup = svg.append("g")
    .attr("class","mainGroupWrapper")
    .attr("transform","translate(" + main_margin.left + "," + main_margin.top + ")")
    .append("g") //another one for the clip path - due to not wanting to clip the labels
    .attr("clip-path", "url(#clip)")
    .style("clip-path", "url(#clip)")
    .attr("class","mainGroup");

  const miniGroup = svg.append("g")
    .attr("class","miniGroup")
    .attr("transform","translate(" + (main_margin.left + main_width + main_margin.right + mini_margin.left) + "," + mini_margin.top + ")");

  const brushGroup = svg.append("g")
    .attr("class","brushGroup")
    .attr("transform","translate(" + (main_margin.left + main_width + main_margin.right + mini_margin.left) + "," + mini_margin.top + ")");

  /////////////////////////////////////////////////////////////
  ////////////////////// Initiate scales //////////////////////
  /////////////////////////////////////////////////////////////

  const main_xScale = d3.scaleLinear().range([0, main_width]);
  const mini_xScale = d3.scaleLinear().range([0, mini_width]);

  // const main_yScale = d3.scaleOrdinal().rangeBands([0, main_height], 0.4, 0);
  const main_yScale = d3.scaleBand().range([[0, main_height], 0.4, 0]);
  // const mini_yScale = d3.scaleOrdinal().rangeBands([0, mini_height], 0.4, 0);
  const mini_yScale = d3.scaleBand().range([0, mini_height], 0.4, 0);

  //Based on the idea from: http://stackoverflow.com/questions/21485339/d3-brushing-on-grouped-bar-chart
  const main_yZoom = d3.scaleLinear()
    .range([0, main_height])
    .domain([0, main_height]);

  //Create x axis object
  const main_xAxis = d3.axisBottom(main_xScale)
    .ticks(4)
    // .tickSize(0)
    .tickSizeOuter(0);

  //Add group for the x axis
  d3.select(".mainGroupWrapper").append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + 0 + "," + (main_height + 5) + ")");

  //Create y axis object
  const main_yAxis = d3.axisLeft(main_yScale)
    .tickSize(0)
    .tickSizeOuter(0);

  //Add group for the y axis
  mainGroup.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(-5,0)");

  /////////////////////////////////////////////////////////////
  /////////////////////// Update scales ///////////////////////
  /////////////////////////////////////////////////////////////

  //Update the scales
  main_xScale.domain([0, d3.max(data, function(d) { return d.total; })]);
  mini_xScale.domain([0, d3.max(data, function(d) { return d.total; })]);
  main_yScale.domain(data.map(function(d) { return d.txid; }));
  mini_yScale.domain(data.map(function(d) { return d.txid; }));

  //Create the visual part of the y axis
  d3.select(".mainGroup").select(".y.axis").call(main_yAxis); // has errors
  d3.select(".mainGroupWrapper").select(".x.axis").call(main_xAxis);
  // throw new Error("Something went badly wrong!");
  /////////////////////////////////////////////////////////////
  ///////////////////// Label axis scales /////////////////////
  /////////////////////////////////////////////////////////////

  textScale = d3.scaleLinear()
    .domain([15,50])
    .range([12,6])
    .clamp(true);

  /////////////////////////////////////////////////////////////
  ///////////////////////// Create brush //////////////////////
  /////////////////////////////////////////////////////////////

  //What should the first extent of the brush become - a bit arbitrary this
  var brushExtent = Math.max( 1, Math.min( 20, Math.round(data.length*0.2) ) );

  brush = d3.brushY(mini_yScale)
    .extent([mini_yScale(data[0].txid), mini_yScale(data[brushExtent].txid)])
    .on("brush", brushmove);
  //.on("brushend", brushend);

  //Set up the visual part of the brush
  gBrush = d3.select(".brushGroup").append("g")
    .attr("class", "brush")
    .call(brush);

  gBrush.selectAll(".resize")
    .append("line")
    .attr("x2", mini_width);

  gBrush.selectAll(".resize")
    .append("path")
    .attr("d", d3.symbol().type("triangle-up").size(20))
    .attr("transform", function(d,i) {
      return i ? "translate(" + (mini_width/2) + "," + 4 + ") rotate(180)" : "translate(" + (mini_width/2) + "," + -4 + ") rotate(0)";
    });

  gBrush.selectAll("rect")
    .attr("width", mini_width);

  //On a click recenter the brush window
  gBrush.select(".background")
    .on("mousedown.brush", brushcenter)
    .on("touchstart.brush", brushcenter);

  /////////////////////////////////////////////////////////////
  /////////////// Set-up the mini bar chart ///////////////////
  /////////////////////////////////////////////////////////////

  //The mini brushable bar
  //DATA JOIN
  var mini_bar = d3.select(".miniGroup").selectAll(".bar")
    .data(data, function(d) { return d.key; });

  //UDPATE
  mini_bar
    .attr("width", function(d) { return mini_xScale(d.total); })
    .attr("y", function(d,i) { return mini_yScale(d.txid); })
    .attr("height", mini_yScale.bandwidth());

  //ENTER
  mini_bar.enter().append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("width", function(d) { return mini_xScale(d.total); })
    .attr("y", function(d,i) { return mini_yScale(d.txid); })
    .attr("height", mini_yScale.bandwidth());
    // .style("fill", "url(#gradient-rainbow-mini)");

  //EXIT
  mini_bar.exit()
    .remove();

  //Start the brush
  gBrush.call(brush.event);



}

//Function runs on a brush move - to update the big bar chart
function update() {

  /////////////////////////////////////////////////////////////
  ////////// Update the bars of the main bar chart ////////////
  /////////////////////////////////////////////////////////////

  //DATA JOIN
  var bar = d3.select(".mainGroup").selectAll(".bar")
    .data(data, function(d) { return d.key; });

  //UPDATE
  bar
    .attr("x", 0)
    .attr("width", function(d) { return main_xScale(d.total); })
    .attr("y", function(d,i) { return main_yScale(d.txid); })
    .attr("height", main_yScale.bandwidth());

  //ENTER
  bar.enter().append("rect")
    .attr("class", "bar")
    .style("fill", "url(#gradient-rainbow-main)")
    .attr("x", 0)
    .attr("width", function(d) { return main_xScale(d.total); })
    .attr("y", function(d,i) { return main_yScale(d.txid); })
    .attr("height", main_yScale.bandiwdth());

  //EXIT
  bar.exit()
    .remove();

}//update

/////////////////////////////////////////////////////////////
////////////////////// Brush functions //////////////////////
/////////////////////////////////////////////////////////////

//First function that runs on a brush move
function brushmove() {

  var extent = brush.extent();

  //Reset the part that is visible on the big chart
  var originalRange = main_yZoom.range();
  main_yZoom.domain( extent );

  /////////////////////////////////////////////////////////////
  ///////////////////// Update the axis ///////////////////////
  /////////////////////////////////////////////////////////////

  //Update the domain of the x & y scale of the big bar chart
  main_yScale.domain(data.map(function(d) { return d.txid; }));
  main_yScale.rangeBands( [ main_yZoom(originalRange[0]), main_yZoom(originalRange[1]) ], 0.4, 0);

  //Update the y axis of the big chart
  d3.select(".mainGroup")
    .select(".y.axis")
    .call(main_yAxis);

  /////////////////////////////////////////////////////////////
  /////////////// Update the mini bar fills ///////////////////
  /////////////////////////////////////////////////////////////

  //Update the colors within the mini bar chart
  var selected = mini_yScale.domain()
    .filter(function(d) { return (extent[0] - mini_yScale.bandwidth() + 1e-2 <= mini_yScale(d)) && (mini_yScale(d) <= extent[1] - 1e-2); });
  //Update the colors of the mini chart - Make everything outside the brush grey
  // d3.select(".miniGroup").selectAll(".bar")
  //   .style("fill", function(d, i) { return selected.indexOf(d.txid) > -1 ? "url(#gradient-rainbow-mini)" : "#e0e0e0"; });

  //Update the label size
  d3.selectAll(".y.axis text")
    .style("font-size", textScale(selected.length));

  //Update the big bar chart
  update();

}//brushmove

/////////////////////////////////////////////////////////////
////////////////////// Click functions //////////////////////
/////////////////////////////////////////////////////////////

//Based on http://bl.ocks.org/mbostock/6498000
//What to do when the user clicks on another location along the brushable bar chart
function brushcenter() {
  var target = d3.event.target,
    extent = brush.extent(),
    size = extent[1] - extent[0],
    range = mini_yScale.range(),
    y0 = d3.min(range) + size / 2,
    y1 = d3.max(range) + mini_yScale.bandwidth() - size / 2,
    center = Math.max( y0, Math.min( y1, d3.mouse(target)[1] ) );

  d3.event.stopPropagation();

  gBrush
    .call(brush.extent([center - size / 2, center + size / 2]))
    .call(brush.event);

}//brushcenter

/////////////////////////////////////////////////////////////
///////////////////// Scroll functions //////////////////////
/////////////////////////////////////////////////////////////

function scroll() {

  //Mouse scroll on the mini chart
  var extent = brush.extent(),
    size = extent[1] - extent[0],
    range = mini_yScale.range(),
    y0 = d3.min(range),
    y1 = d3.max(range) + mini_yScale.bandwidth(),
    dy = d3.event.deltaY,
    topSection;

  if ( extent[0] - dy < y0 ) { topSection = y0; }
  else if ( extent[1] - dy > y1 ) { topSection = y1 - size; }
  else { topSection = extent[0] - dy; }

  //Make sure the page doesn't scroll as well
  d3.event.stopPropagation();
  d3.event.preventDefault();

  gBrush
    .call(brush.extent([ topSection, topSection + size ]))
    .call(brush.event);

}//scroll