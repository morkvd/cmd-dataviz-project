function preProcess(transaction) {
  return Object.assign(
    {},
    transaction,
    {
      amount: +transaction.amount // turn transaction amount into a Number
    }
  );
}

d3.csv('/assets/data/data.csv', preProcess, function (fraudData) {
  /* Program layout

    1. Calculate extra fields based on fraud checks and add these to each row (transaction)
      respectively (for example how muuch a transaction.amount deviates from the mean)
    2. Calculate how much 'fraud points' each transaction gets, based on the extra fields added
      on the previous step, and add these to each transaction (we do this as a separate step so
      we can easily tweak the point calculation)
    3. Draw the chart with d3
  */

  /* Fraud checks

    There are 7 fraud indicators we test on:
    1. The amount does not coincide with the average amount
      Extra thingies:
      a. The transaction amount is 0
      b. The transaction amount has more than two decimal points
    2. Shopper email or card number is used in quick succession
    3. Shopper country is high risk
    4. Different countries used by the same shopper email address
    5. Shopper country differs from issuing country and/or country of currency
    6. Card number already used by other shopper (shopper email)
    7. Transaction time check
  */




  /* precalculation for check 1 */
  function calculateMean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function calculateVariance(arr) {
    let arrMean = calculateMean(arr);
    return arr.map(a => Math.pow(a - arrMean, 2)).reduce((a, b) => a + b) / arr.length;
  }

  // Get the amounts from the dataset
  const TRANSACTION_AMOUNTS = fraudData.map((transaction) => transaction.amount);

  const MEAN = calculateMean(TRANSACTION_AMOUNTS);

  // Calculate standardDeviation: (http://www.mathsisfun.com/data/standard-deviation.html)
  const STANDARDDEVIATION = Math.sqrt(calculateVariance(TRANSACTION_AMOUNTS));

  const TRANSACTION_MAX = d3.max(TRANSACTION_AMOUNTS);

  function addDeviation(transaction) {
    return {
      isAboveStandardDeviation: transaction.amount > (MEAN + STANDARDDEVIATION),
      isBelowStandardDeviation: transaction.amount < (MEAN - STANDARDDEVIATION),
    };
  }

  function addPercentageDifference(transaction) {
    return {
      differenceInPercentage: (transaction.amount / MEAN) * 100,
    };
  }

  /* Fraud check 1 'The amount does not coincide with the average amount' */
  function checkOne(transaction) {
    const scale = d3.scaleLinear()
                    .domain([MEAN + STANDARDDEVIATION, TRANSACTION_MAX])
                    .rangeRound([0, 25])
                    .clamp(true);

    let points = 0;
    let hasMoreThanTwoDecimalPlaces = false;

    if (transaction.amount.toString().indexOf('.') !== -1) {
      hasMoreThanTwoDecimalPlaces = transaction.amount.toString().split('.')[1].length > 2;
    }


    if (transaction.amount === 0 || hasMoreThanTwoDecimalPlaces) {
      points = 25;
    } else if (transaction.amount > (MEAN + STANDARDDEVIATION)) {
      points = scale(transaction.amount);
    }
    return { checkOne: points };
  }

  /* Fraud check 2 'Shopper email or card number is used in quick succession' */

  // preprocessing check 2:
  // step 1 nest data by email
  // step 2 filter out all entries that have only one occurence
  // step 3 for each remaining entry, sort transactions by date (use moment js)
  // step 4 if there are less as N minutes between one transaction and the previous one,
  //        add points else add no points

  function nestBy(data, field) {
    return d3.nest()
             .key(function(d)  { return d[field]; })
             //.rollup(countRepeatedTries)
             .entries(data);
  }

  function sortOnDate(v) {
    return v.sort(function (left, right) {
      return moment.utc(left.creationdate).diff(moment.utc(right.creationdate))
    });
  }

  const NESTED_BY_EMAIL_ID = nestBy(fraudData, 'email_id').filter(function (a) {
    return a.values.length > 1;
  });

  const NESTED_BY_CARD_ID = nestBy(fraudData, 'card_id').filter(function (d) {
    return d.values.length > 1;
  });
  console.table(NESTED_BY_CARD_ID);
  console.table(NESTED_BY_CARD_ID[0].values)
  console.table(sortOnDate(NESTED_BY_CARD_ID[0].values))



  /* Fraud check 3 'Shopper country is high risk' */
  // independent

  /* Fraud check 4 ' Different countries used by the same shopper email address' */
  // dependent

  /* Fraud check 5 'Shopper country differs from issuing country and/or country of currency' */
  // independent

  /* Fraud check 6 'Card number already used by other shopper (shopper email)' */
  // dependent

  /* Fraud check 7 'Transaction time check' */
  // independent

  /* Add aditional fraud info to transaction */

  function addCalculatedFraudIndicators(data) {
    return data.map(function(transaction) {
      return Object.assign({},
        addDeviation(transaction),
        addPercentageDifference(transaction),
        transaction
      );
    });
  }

  const ENHANCED_DATA = addCalculatedFraudIndicators(fraudData);

  /* Calculate Points */
  function givePoints(enhancedData) {
    return enhancedData.map(function(transaction) {
      return Object.assign({},
        checkOne(transaction),
        transaction
      );
    });
  }

  //const FINISHED_DATA = givePoints(ENHANCED_DATA);
  //console.table(FINISHED_DATA);

  /* Draw chart */

});
