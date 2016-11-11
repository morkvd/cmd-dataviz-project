// Change check info

const checkInfo = [
  {
    "check": "checkOne",
    "title": "The amount does not coincide with the average amount",
    "description": "<p>Each merchant usually sells in a specific range of products. Fraudsters want to get the most out of their transactions and therefore have amounts that are much higher than the average. However, keep in mind that what is a “normal” region for amounts to be in can differ between merchants.</p>"
  },
  {
    "check": "checkTwo",
    "title": "Shopper email or card number is used in quick succession",
    "description": "<p>Velocity checks allow merchants to set velocity thresholds on various customer attributes, controlling how often a customer can attempt transactions. These checks are intended to identify high-speed fraud attacks. To best utilize these checks merchants need to understand the behavior of their shoppers. The average number of transactions by a good user varies significantly across merchants.</p><p>When the same email address or card number is used often within a small period, this is a good case for fraud.</p>"
  },
  {
    "check": "checkThree",
    "title": "Shopper country is high risk",
    "description": "<p>Some countries pose a high risk for fraud, regardless of what the country of the currency or issuing country is, such as Mexico or Bulgaria.</p>"
  },
  {
    "check": "checkFour",
    "title": "Different countries used by the same shopper email address",
    "description": "<p>Fraudsters often have a fraud profile that spans multiple regions. When one shopper email address or card number gets associated with multiple countries, this is an indication of possible fraud.</p>"
  },
  {
    "check": "checkFive",
    "title": "Shopper country differs from issuing country and/or country of currency",
    "description": "<p>This risk check is triggered when a transaction has the shopper country different from the issuing country (of the card) or that is different from the country from which the currency comes.</p>"
  },
  {
    "check": "checkSix",
    "title": "Card number already used by other shopper (shopper email)",
    "description": "<p>Fraudsters often create multiple accounts and attempt to use the same compromised account with different techniques and attack merchants. This check is aimed at identifying when a card number is being used across multiple accounts.</p><p>Note that there are some legitimate cases in which this would occur:</p><ul><li>The user may have multiple accounts.</li><li>It may be a shared card in a family or business setting</li></ul>"
  },
  {
    "check": "checkSeven",
    "title": "Transaction time check",
    "description": "<p>Most merchants notice that fraudsters tend to visit their site during certain parts of the day. It is not uncommon, for example, for fraud to spike during the night hours while legitimate transactions are limited.</p>"
  }
];

const $trigger = $('.triggerCheck');
const checkTitle = document.getElementsByClassName('header-check');
const checkDescription = document.getElementsByClassName('description-check');
let CURRENTLY_SELECTED_CHECK = checkInfo[0].check; // barchart.js looks at this to see what check is active
                                                   // terrible code, too tired to care
function drawBarChart(element, data, threshold) {

  // Panels

  const totalFraudulentPayments = data.filter((d) => d.total > FRAUD_THRESHOLD);
  const percentageFraud = (totalFraudulentPayments.length / data.length * 100).toFixed(2);

  const $percentageFraudElement = $('.percentageFraud');
  $percentageFraudElement.html(percentageFraud + '%');

  const totalTransactions = data.length;

  const $totalTransactionsElement = $('.totalTransactions');
  $totalTransactionsElement.html(totalTransactions);

  const totalFraudulentPaymentPoints = totalFraudulentPayments.map(d => d.total).reduce((a, b) => a + b, 0);

  let totalPointsSelectedCheck = totalFraudulentPayments.map(d => d[CURRENTLY_SELECTED_CHECK]).reduce((a, b) => a + b, 0);
  let percentagePointsSelectedCheck = (totalPointsSelectedCheck / totalFraudulentPaymentPoints * 100).toFixed(2);
  const $percentagePointsElement = $('.percentagePoints');
  $percentagePointsElement.html(percentagePointsSelectedCheck + '%');

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
        .attr("x", function(d, i) { return x( i + selection[0] ) - (barW / 2); })
        .attr("y", function(d) { return y(d.total); })
        .attr("width", function() { return barW; })
        .attr("height", function(d) { return height - y(d.total); });

    bars.enter()
          .append("rect")
        .attr("class", "bar enter")
        .attr("x", function(d, i) { return x(i + selection[0]) - (barW / 2); })
        .attr("y", function(d) { return y(d[CURRENTLY_SELECTED_CHECK]); }) // CURRENTLY_SELECTED_CHECK is defined in triggercheck.js
        .attr("width", function() { return barW; })
        .attr("height", function(d) { return height - y(d[CURRENTLY_SELECTED_CHECK]); });

    focus.append('line')
         .attr("x1", 0)
         .attr("y1", y(threshold))
         .attr("x2", width)
         .attr("y2", y(threshold))
         .attr("stroke-width", 2)
         .attr("shape-rendering", "crispEdges")
         .attr("stroke", "#aa111f");

    focus.append('rect')
         .attr("x", width - 112)
         .attr("y", y(threshold) - 16)
         .attr("height", "1em")
         .attr("width", 100)
         .attr("shape-rendering", "crispEdges")
         .attr('fill', '#FFFFFF')

    focus.append('text')
         .attr("x", width - 20)
         .attr("y", y(threshold) - 4)
         .attr("shape-rendering", "crispEdges")
         .attr('fill', '#222')
         .attr('text-anchor', 'end')
         .attr('font-size', '12')
         .attr('font-family', 'Arial')
         .text('Fraud threshold');

    focus.append('line')
         .attr("x1", 0)
         .attr("y1", y(25))
         .attr("x2", width)
         .attr("y2", y(25))
         .attr("stroke-width", 2)
         .attr("shape-rendering", "crispEdges")
         .attr("stroke", "#222");

    focus.append('rect')
         .attr("x", width - 80)
         .attr("y", y(25) - 16)
         .attr("height", "1em")
         .attr("width", 68)
         .attr("shape-rendering", "crispEdges")
         .attr('fill', '#FFFFFF')

    focus.append('text')
         .attr("x", width - 20)
         .attr("y", y(25) - 4)
         .attr("shape-rendering", "crispEdges")
         .attr('fill', '#222')
         .attr('text-anchor', 'end')
         .attr('font-size', '12')
         .attr('font-family', 'Arial')
         .text('Max score');
  }

  var s = x2.range();

  function triggerCheck() {
    $trigger.removeClass('is-active');
    $(this).addClass('is-active');
    const selectedCheck = $(this).attr('data-for').substring(6, 7) - 1;
    checkTitle[0].innerHTML = checkInfo[selectedCheck].title;
    checkDescription[0].innerHTML = checkInfo[selectedCheck].description;
    CURRENTLY_SELECTED_CHECK = checkInfo[selectedCheck].check;
    drawBars(data, x2.range());
    d3.select('.brush').call(brush.move, [0, s[1]]);


    let totalPointsSelectedCheck = totalFraudulentPayments.map(d => d[CURRENTLY_SELECTED_CHECK]).reduce((a, b) => a + b, 0);
    let percentagePointsSelectedCheck = (totalPointsSelectedCheck / totalFraudulentPaymentPoints * 100).toFixed(2);
    $percentagePointsElement.html(percentagePointsSelectedCheck + '%');

  }

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
    s = selectedRange || x2.range();
    var xs = s.map(x2.invert, x2);

    x.domain(xs);


    // from Programmatically Control a d3 brush
    // http://bl.ocks.org/timelyportfolio/5c136de85de1c2abb6fc
    /*if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.
    d3.select(this).transition().call(d3.event.target.move, selectedRange);
*/

    focus.select(".area").attr("d", area);
    focus.select(".axis--x").call(xAxis);

    drawBars(data.slice(xs[0], xs[1]), xs);

  }

  $trigger.click(triggerCheck);

}

$(function() {
  checkTitle[0].innerHTML = checkInfo[0].title;
  checkDescription[0].innerHTML = checkInfo[0].description;
});
