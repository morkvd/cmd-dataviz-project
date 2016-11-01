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

  /* Fraud check 1 'The amount does not coincide with the average amount' */

  // Calculate standardDeviation: (http://www.mathsisfun.com/data/standard-deviation.html)

  function calculateStandardDeviation(data) {

    // calculate mean of given array
    function calculateMean(arr) {
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    // calculate variance of given array
    // (variance == average of squared difference between value and mean,
    //  where the values are the items in the array)
    function calculateVariance(arr) {
      let arrMean = calculateMean(arr);
      return arr.map(a => Math.pow(a - arrMean, 2)).reduce((a, b) => a + b) / arr.length;
    }

    function calculateDeviation(transaction) {
      // get the amounts from the dataset
      const transactionAmounts = data.map((transaction) => transaction.amount);
      // caculate the mean from this amount
      const mean = calculateMean(transactionAmounts);
      // calculate the standardDeviation
      const standardDeviation = Math.sqrt(calculateVariance(transactionAmounts))
      
      const differenceInPercentage = (transaction.amount / mean) * 100;
      const standardDeviationUpper = mean + standardDeviation;
      const standardDeviationLower = mean - standardDeviation;
      return {
        isLargerThanStandardDeviation: transaction.amount > standardDeviationUpper,
        isSmallerThanStandardDeviation: transaction.amount < standardDeviationLower,
        differenceInPercentage: differenceInPercentage,
      };
    }

    function addStandardDeviation(transaction) {
      return Object.assign({},
        calculateDeviation(transaction),
        transaction
      );
    }

    return data.map(addStandardDeviation);
  }

  console.table(calculateStandardDeviation(fraudData));

  //console.table(fraudData.map(addCalculatedFraudIndicators))

  /* Fraud check 2 'Shopper email or card number is used in quick succession' */

  /* Fraud check 3 'Shopper country is high risk' */

  /* Fraud check 4 ' Different countries used by the same shopper email address' */

  /* Fraud check 5 'Shopper country differs from issuing country and/or country of currency' */

  /* Fraud check 6 'Card number already used by other shopper (shopper email)' */

  /* Fraud check 7 'Transaction time check' */

  /* Add fraud info to transaction */

  /* Calculate Points */

  /* Statistics over whole dataset */

  /* Draw chart */



});
