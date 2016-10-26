d3.csv('data/data.csv', function (data) {

  // the average of all the transaction values (the amount of money paid)
  const sumAmount = data.map((transaction) => +transaction.amount)
                        .reduce((prevVal, currVal) => prevVal + currVal);
  const meanAmount = sumAmount / data.length;

  function calculateDeviation (transaction) {
    const deviation = (transaction.amount / meanAmount) * 100;
    const differenceFromMean = transaction.amount - meanAmount
    return Object.assign(
      {
        deviation: deviation,
        differenceFromMean: differenceFromMean,
      },
    transaction
    );
  }

  const transactionsWithExtraCalculations = data.map(calculateDeviation)

  function calculateVariance (transaction) {
    return Math.pow(transaction.differenceFromMean, 2);
  }

  const varianceSum = transactionsWithExtraCalculations
    .map(calculateVariance)
    .reduce((previousValue, currentValue) => {
      return previousValue + currentValue;
    });

  const standardDeviation = Math.sqrt(varianceSum / transactionsWithExtraCalculations.length)

  console.log(d3.max(data.map((transaction) => +transaction.amount)));

  const coolAssScale = d3.scaleLinear()
                        .domain([meanAmount + standardDeviation, d3.max(data.map((transaction) => +transaction.amount))])
                        .rangeRound([0, 20])
                        .clamp(true)

  console.log(standardDeviation);
  console.log(meanAmount);

  // if the value is 0 ALARM
  // if the value has more than two numbers after the comma HALP
  // else use scale

  function handleTransactionAmount (transaction) {
    if (transaction.amount == '0') {

    }
    return Object.assign(
      {
        score: transaction.amount == '0' ? 20 : coolAssScale(transaction.amount),
      },
      transaction
    );
  }

  console.table(data.map(handleTransactionAmount))

});
