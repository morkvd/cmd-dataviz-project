function preProcess(transaction) {
  return Object.assign(
    {},
    transaction,
    {
      amount: +transaction.amount // turn transaction amount into a Number
    }
  );
}

d3.csv('data/data.csv', preProcess, function (fraudData) {

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

  /* Fraud check 1 'The amount does not coincide with the average amount' */

  // Calculate standardDeviation: (http://www.mathsisfun.com/data/standard-deviation.html)

  const transactionAmounts = fraudData.map((transaction) => transaction.amount);

  function mean(arr) {
    return arr.reduce((a, b) => a + b) / arr.length
  }

  function variance(arr) {
    let arrMean = mean(arr);
    return arr.map(a => Math.pow(a - arrMean, 2)).reduce((a, b) => a + b) / arr.length;
  }

  const transactionAmountsMean = mean(transactionAmounts);
  const transactionAmountsVariance = variance(transactionAmounts)
  const transactionAmountsStandardDeviation = Math.sqrt(transactionAmountsVariance)

  console.log('mean');
  console.log(transactionAmountsMean);
  console.log('variance');
  console.log(transactionAmountsVariance);
  console.log('standardDeviation');
  console.log(transactionAmountsStandardDeviation);

  function calculateDeviation (transaction) {
    const deviation = (transaction.amount / transactionAmountsMean) * 100;
    const differenceFromMean = transaction.amount - transactionAmountsMean;
    return {
      sd: transaction.amount / transactionAmountsStandardDeviation,
      deviation: deviation,
      differenceFromMean: differenceFromMean,
    };
  }

  function addCalculatedFraudIndicators (transaction) {
    return Object.assign({},
      calculateDeviation (transaction),
      transaction
    );
  }

  console.table(fraudData.map(addCalculatedFraudIndicators))

  /* Fraud check 2 'Shopper email or card number is used in quick succession' */

  /* Fraud check 3 'Shopper country is high risk' */

  /* Fraud check 4 ' Different countries used by the same shopper email address' */

  /* Fraud check 5 'Shopper country differs from issuing country and/or country of currency' */

  /* Fraud check 6 'Card number already used by other shopper (shopper email)' */

  /* Fraud check 7 'Transaction time check' */

  /* Add fraud info to transaction */

  /* Calculate Points */
  const maxTransactionAmount = d3.max(fraudData.map((transaction) => transaction.amount))

  const processedData = fraudData.map(addCalculatedFraudIndicators)

  const varianceSum = processedData.map((transaction) => Math.pow(transaction.differenceFromMean, 2))
                                   .reduce((previousVal, currentVal) => previousVal + currentVal);

  const standardDeviation = Math.sqrt(varianceSum / processedData.length);

  const scaleFraudCheck1 = d3.scaleLinear()
                             .domain([transactionAmountsMean + standardDeviation, maxTransactionAmount])
                             .rangeRound([0, 20])
                             .clamp(true);

  /* Statistics over whole dataset */


  console.log(standardDeviation);
  console.log(transactionAmountsMean);

  /* Draw chart */



});
