function drawBarChart(element, data) {

  console.table(data);

  var svg = d3.select(element),
    margin = {top: 20, right: 20, bottom: 110, left: 40},
    margin2 = {top: 430, right: 20, bottom: 30, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;

  var x = d3.scaleLinear().range([0, width]),
    x2 = d3.scaleLinear().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    y2 = d3.scaleLinear().range([height2, 0]);

  var xAxis = d3.axisBottom(x),
    xAxis2 = d3.axisBottom(x2),
    yAxis = d3.axisLeft(y);

  var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);

  var area = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d, i) { return x(i); })
    .y0(height)
    .y1(function(d) { return y(d.total); });

  var area2 = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d, i) { return x2(i); })
    .y0(height2)
    .y1(function(d) { return y2(d.total); });

  svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    x.domain(d3.extent(data, function(d, i) { return i; }));
    y.domain([0, d3.max(data, function(d) { return d.total; })]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    focus.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, i) { return x( i ); })
      .attr("y", function(d) { return y(d.total); })
      .attr("width", function() {
        // console.log(width);
        // console.log(data.length);
        return width / data.length;
      })
      .attr("height", function(d) { return height - y(d.total); });

    focus.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    focus.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);

    context.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area2);

    context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

    context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

  function brushed() {
    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));
    focus.select(".area").attr("d", area);
    focus.select(".axis--x").call(xAxis);
    focus.selectAll(".bar")
      .attr("x", function(d, i) { return x(i); });
  }

}
