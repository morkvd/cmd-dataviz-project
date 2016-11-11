function drawBarChart(element, data, threshold) {

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

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  // debounce function stolen from https://github.com/jashkenas/underscore/blob/master/underscore.js
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  const efficientDrawBars = debounce(drawBars, 10);

  function drawBars(dataset, selection) {
    var bars = focus.selectAll(".bar").data(dataset, datum => datum);
    var segment = width / dataset.length;
    var tenth = (segment / 10);
    var barW = (segment / 10) * 8;

    bars.exit().remove();

    //ENTER
    bars.enter()
          .append("rect")
        // .attr("class", "bar")
        .attr("class", function(d) { return d.total < FRAUD_THRESHOLD + 1 ? "bar" : "bar is-fraud" })
        .attr("x", function(d, i) { return x( i + selection[0] ); })
        .attr("y", function(d) { return y(d.total); })
        .attr("width", function() { return barW; })
        .attr("height", function(d) { return height - y(d.total); });

    bars.enter()
          .append("rect")
        .attr("class", "bar enter")
        .attr("x", function(d, i) { return x(i + selection[0]) - (barW / 2); })
        .attr("y", function(d) { return y(d.checkOne); })
        .attr("width", function() { return barW; })
        .attr("height", function(d) { return height - y(d.checkOne); });

    focus.append('line')
         .attr("x1", 0)
         .attr("y1", y(threshold))
         .attr("x2", width)
         .attr("y2", y(threshold))
         .attr("stroke-width", 2)
         .attr("stroke", "#cc333f");
  }

  // efficientDrawBars(data, x2.range());
  drawBars(data, x2.range());

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
    .call(brush.move, [0, x.range()[1] / 3]);

  function brushed() {
    var selectedRange = d3.event.selection;
    var selectedRangeWidth = Math.abs(d3.event.selection[0] - d3.event.selection[1]);
    var minSelectionWidth = 15;
    if (selectedRangeWidth < minSelectionWidth) {
      selectedRange = [selectedRange[0], selectedRange[0] + minSelectionWidth];
    }
    var s = selectedRange || x2.range();
    var xs = s.map(x2.invert, x2)

    x.domain(xs);


    // from Programmatically Control a d3 brush
    // http://bl.ocks.org/timelyportfolio/5c136de85de1c2abb6fc
    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.
    d3.select(this).transition().call(d3.event.target.move, selectedRange);


    focus.select(".area").attr("d", area);
    focus.select(".axis--x").call(xAxis);

<<<<<<< e5bdeb527561b3958da3f06c286336db6286a983
    // efficientDrawBars(data.slice(rounded[0], rounded[1]), rounded);
    drawBars(data.slice(rounded[0], rounded[1]), rounded);
=======
    efficientDrawBars(data.slice(xs[0], xs[1]), xs);
>>>>>>> position bar on top of axis tics instead of between them

  }

}
