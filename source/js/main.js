function preProcess(transaction) {
  return Object.assign({},
    transaction,
    {
      amount: +transaction.amount // turn transaction amount into a Number
    }
  );
}

//currency country mapping from: https://gist.github.com/HarishChaudhari/4680482

d3.queue()
  .defer(d3.csv, '/assets/data/data.csv', preProcess)
  .defer(d3.csv, '/assets/data/Country_Currency_Code_Mappings.csv')
  .await((error, paymentData, currencyData) => {
    if (error) {
      console.error(`problem loading data: ${error}`);
    } else {
      fraudeCheck(paymentData, currencyData)
    }
  });

function fraudeCheck(fraudData, currencyData) {
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


  /* GLOBAL VARIABLES */

  // Get the amounts from the dataset
  const TRANSACTION_AMOUNTS = fraudData.map((transaction) => transaction.amount);

  const MEAN = calculateMean(TRANSACTION_AMOUNTS);

  // Calculate standardDeviation: (http://www.mathsisfun.com/data/standard-deviation.html)
  const STANDARDDEVIATION = calculateStandardDeviation(TRANSACTION_AMOUNTS);
  const STANDARDDEVIATION_UPPER = MEAN + STANDARDDEVIATION;
  const STANDARDDEVIATION_LOWER = MEAN - STANDARDDEVIATION;

  // highest transaction value
  const TRANSACTION_MAX = d3.max(TRANSACTION_AMOUNTS);

  // object where the keys are all email_id's and the values are the amount of quickly repeated
  // transactions made with that email address.
  const REPEATED_TRANSACTIONS_BY_EMAIL_ID = createLookupObject(fraudData, 'email_id', countRepeatedTries)

  // same as above but with card_id.
  const REPEATED_TRANSACTIONS_BY_CARD_ID = createLookupObject(fraudData, 'card_id', countRepeatedTries)

  const COUNTRY_THREAT_LEVEL = {
    "": 17,
    "(unknown)": 17,
    "AE": 20,
    "AL": 5,
    "AT": 3,
    "AU": 7,
    "AW": 12,
    "BA": 8,
    "BE": 2,
    "BG": 17,
    "BR": 25,
    "CA": 2,
    "CH": 1,
    "CN": 20,
    "CO": 23,
    "CW": 10,
    "CY": 5,
    "CZ": 8,
    "DE": 3,
    "DK": 1,
    "DO": 14,
    "EC": 15,
    "EE": 2,
    "EG": 10,
    "ES": 4,
    "FI": 1,
    "FR": 3,
    "GB": 4,
    "GI": 21,
    "GR": 5,
    "HK": 18,
    "HU": 20,
    "IL": 12,
    "IN": 22,
    "IR": 3,
    "IS": 8,
    "IT": 3,
    "JO": 13,
    "JP": 16,
    "KR": 17,
    "KZ": 8,
    "LU": 2,
    "LV": 9,
    "MA": 12,
    "MM": 13,
    "MT": 18,
    "MX": 25,
    "MY": 14,
    "NG": 20,
    "NL": 2,
    "NO": 1,
    "NZ": 1,
    "PA": 15,
    "PE": 16,
    "PH": 23,
    "PT": 2,
    "RO": 25,
    "RS": 4,
    "RU": 19,
    "SE": 2,
    "SG": 7,
    "SI": 15,
    "SK": 4,
    "SN": 21,
    "TH": 18,
    "TR": 11,
    "TW": 13,
    "US": 10
  };

  const COUNTRIES_BY_EMAIL_ID = createLookupObject(fraudData, 'email_id', countCountries);

  const EMAIL_IDS_BY_CARD_ID = createLookupObject(fraudData, 'card_id', countEmailIds);

  const COUNTRIES_BY_CURRENCY = createLookupObject(currencyData, 'Code', listCountries);

  const FRAUD_THRESHOLD = 75;

  /* SCALES */
  const checkOneScale = d3.scaleLinear()
                          .domain([STANDARDDEVIATION_UPPER, TRANSACTION_MAX])
                          .rangeRound([0, 25])
                          .clamp(true);

  const checkTwoScale = d3.scaleLinear()
                          .domain([0, 10])
                          .rangeRound([0, 25])
                          .clamp(true);

  const checkFourScale = d3.scaleLinear()
                          .domain([1, 3])
                          .rangeRound([0, 25])
                          .clamp(true);

  const checkFiveScale = d3.scaleLinear()
                          .domain([0, 3])
                          .rangeRound([0, 25])
                          .clamp(true);

  const checkSixScale = d3.scaleLinear()
                          .domain([1, 5])
                          .rangeRound([0, 25])
                          .clamp(true);

  const checkSevenScale = d3.scaleLinear()
                          .domain([0, 12])
                          .rangeRound([0, 25])
                          .clamp(true);


  /* Fraud check #1 : 'The amount does not coincide with the average amount' */

  function calculateMean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function calculateStandardDeviation(arr) {
    let arrMean = calculateMean(arr);
    return Math.sqrt(arr.map(a => Math.pow(a - arrMean, 2)).reduce((a, b) => a + b) / arr.length);
  }

  function addDeviation(transaction) {
    return {
      isAboveStandardDeviation: transaction.amount > STANDARDDEVIATION_UPPER,
      isBelowStandardDeviation: transaction.amount < STANDARDDEVIATION_LOWER,
    };
  }

  function addPercentageDifference(transaction) {
    return {
      differenceInPercentage: (transaction.amount / MEAN) * 100,
    };
  }

  function checkOne(transaction) {
    const transactionAmountAsString = transaction.amount.toString();

    let points = 0;
    let hasMoreThanTwoDecimalPlaces = (transactionAmountAsString.indexOf('.') !== -1)
      ? (transactionAmountAsString.split('.')[1].length > 2)
      : false;

    if (transaction.amount === 0 || hasMoreThanTwoDecimalPlaces) {
      points = 25;
    } else if (transaction.amount > STANDARDDEVIATION_UPPER) {
      points = checkOneScale(transaction.amount);
    }
    return { checkOne: points };
  }


  /* Fraud check #2 : 'Shopper email or card number is used in quick succession' */

  function byCreationDate(left, right) {
    return moment.utc(left.creationdate).diff(moment.utc(right.creationdate))
  };

  function addDifferenceBetweenCreationDates(transaction, i, transactions) {
    return Object.assign({},
      transaction,
      {
        diffWithPrevTransaction:
          i === 0
            ? 0 // return 0 on first transaction because there isn't a previous transaction to compare to
            : moment.utc(transaction.creationdate).diff(moment.utc(transactions[i - 1].creationdate), 'seconds')
      }
    );
  }

  function transactionsWithHighDifference(transaction) {
    return transaction.diffWithPrevTransaction < 900;
  }

  // takes values of nested data
  // returns amount of quickly repeating transactions
  function countRepeatedTries(values) {
    return (
      values.length === 1
        ? 0
        : values.sort(byCreationDate)
                .map(addDifferenceBetweenCreationDates)
                .filter(transactionsWithHighDifference)
                .length
    );
  }

  // takes an array of objects: [{email1: 5}, {email2: 0}, {email3: 99}]
  // returns combined object: { email1: 5, email2: 0, email3: 99}
  function flattenObj(a, b) {
    return Object.assign({}, a, { [b.key]: b.value });
  }

  function createLookupObject(data, field, rollupFun) {
    return d3.nest()
             .key(d => d[field])
             .rollup(rollupFun)
             .entries(data)
             .reduce(flattenObj, {});
  }

  function addRepeatedTransactions(transaction) {
    return {
      emailIdRepeats: REPEATED_TRANSACTIONS_BY_EMAIL_ID[transaction.email_id],
      cardIdRepeats: REPEATED_TRANSACTIONS_BY_CARD_ID[transaction.card_id],
    };
  }

  function checkTwo(transaction) {
    const highestRepeats = (
      transaction.cardIdRepeats > transaction.emailIdRepeats
        ? transaction.cardIdRepeats
        : transaction.emailIdRepeats
    );
    return { checkTwo: checkTwoScale(highestRepeats) };
  }


  /* Fraud check #3 : 'Shopper country is high risk' */
  // independent
  function checkThree(transaction) {
    return { checkThree: COUNTRY_THREAT_LEVEL[transaction.shoppercountrycode] };
  }


  /* Fraud check #4 : 'Different countries used by the same shopper email address' */
  // dependent

  // takes values of nested data
  // returns amount of shoppercountrycodes
  function countCountries(values) {
    return values.map(transaction => transaction.shoppercountrycode)
                 .sort()
                 .filter((item, pos, ary) => !pos || item != ary[pos - 1]) // filter out duplicates (keep item if it is not the same as the previous item)
                 .length;
  }

  function checkFour(transaction) {
    return { checkFour: checkFourScale(COUNTRIES_BY_EMAIL_ID[transaction.email_id]) }
  }


  /* Fraud check #5 : 'Shopper country differs from issuing country and/or country of currency' */
  // independent
  function listCountries(values) {
    return values.map(country => country.CountryCode)
  }

  //  currencycode        vs  issuercountrycode    = currencyVsIssuerCountry
  //  currencycode        vs  shoppercountrycode   = currencyVsShopperCountry
  //  issuercountrycode   vs  shoppercountrycode   = IssuerCountryVsShopperCountry
  function addCountryDifferences(transaction) {
    return {
      currencyVsIssuerCountry:
        COUNTRIES_BY_CURRENCY[transaction.currencycode].indexOf(transaction.issuercountrycode) > -1,
      currencyVsShopperCountry:
        COUNTRIES_BY_CURRENCY[transaction.currencycode].indexOf(transaction.shoppercountrycode) > -1,
      IssuerCountryVsShopperCountry:
        transaction.issuercountrycode === transaction.shoppercountrycode,
    };
  }

  function checkFive(transaction) {
    return {
      checkFive: checkFiveScale(!transaction.currencyVsIssuerCountry +
                                !transaction.currencyVsShopperCountry +
                                !transaction.IssuerCountryVsShopperCountry),
    };
  }


  /* Fraud check #6 : 'Card number already used by other shopper (shopper email)' */
  // dependent

  function countEmailIds(values) {
    return values.map(transaction => transaction.email_id)
                 .sort()
                 .filter((item, pos, ary) => !pos || item != ary[pos - 1]) // filter out duplicates (keep item if it is not the same as the previous item)
                 .length;
  }

  function checkSix(transaction) {
    return { checkSix: checkSixScale(EMAIL_IDS_BY_CARD_ID[transaction.card_id]) }
  }


  /* Fraud check #7 : 'Transaction time check' */
  // independent
  function addTimedifference(transaction) {
    const transactionDate = moment.utc(transaction.creationdate);
    const mostSuspiciousTime = moment.utc([
      transactionDate.year(),
      transactionDate.month(),
      (transactionDate.hours() > 11) // if its 12 o clock or later
        ? transactionDate.date() + 1 // compare to midnight next day
        : transactionDate.date(),    // else compare to midnight this day
      0, // (PS: if you change this value the value 3 lines back should also change)
    ]);
    return {
      timeDifferenceWithPeakFraudHour: Math.abs(transactionDate.diff(mostSuspiciousTime, 'hours')),
    };
  }

  function checkSeven(transaction) {
    return { checkSeven: checkSevenScale(12 - transaction.timeDifferenceWithPeakFraudHour) }
  }


  /* Add aditional fraud info to transaction */

  function addCalculatedFraudIndicators(data) {
    return data.map(transaction => {
      return Object.assign({},
        addDeviation(transaction),
        addPercentageDifference(transaction),
        addRepeatedTransactions(transaction),
        addCountryDifferences(transaction),
        addTimedifference(transaction),
        transaction
      );
    });
  }

  const ENHANCED_DATA = addCalculatedFraudIndicators(fraudData);


  /* Calculate Points */
  function givePoints(enhancedData) {
    return enhancedData.map(transaction => {
      return Object.assign({},
        checkOne(transaction),
        checkTwo(transaction),
        checkThree(transaction),
        checkFour(transaction),
        checkFive(transaction),
        checkSix(transaction),
        checkSeven(transaction),
        transaction
      );
    });
  }

  const SCORED_DATA = givePoints(ENHANCED_DATA);


  /* Calculate total */
  function calculateTotalPoints(scoredData) {
    return scoredData.map(transaction => {
      return Object.assign({},
        {
          total:
            transaction.checkOne +
            transaction.checkTwo +
            transaction.checkThree +
            transaction.checkFour +
            transaction.checkFive +
            transaction.checkSix +
            transaction.checkSeven,
        },
        transaction
      );
    });
  }

  const TOTAL_DATA = calculateTotalPoints(SCORED_DATA);

  /* Calculate data required for the radar chart */
  function calculateMeanPoints(dataset) {
    return [
      { axis: 'Check One',    value: calculateMean(dataset.map(d => d.checkOne))    },
      { axis: 'Check Two',    value: calculateMean(dataset.map(d => d.checkTwo))    },
      { axis: 'Check Three',  value: calculateMean(dataset.map(d => d.checkThree))  },
      { axis: 'Check Four',   value: calculateMean(dataset.map(d => d.checkFour))   },
      { axis: 'Check Five',   value: calculateMean(dataset.map(d => d.checkFive))   },
      { axis: 'Check Six',    value: calculateMean(dataset.map(d => d.checkSix))    },
      { axis: 'Check Seven',  value: calculateMean(dataset.map(d => d.checkSeven))  },
    ];
  }

  const fraudStats = calculateMeanPoints(TOTAL_DATA.filter(item => item.total > FRAUD_THRESHOLD));
  const legitStats = calculateMeanPoints(TOTAL_DATA.filter(item => item.total <= FRAUD_THRESHOLD));
  const totalStats = calculateMeanPoints(TOTAL_DATA);

  console.table(fraudStats);
  console.table(legitStats);
  console.table(totalStats);

  // /* extract country codes from data */
  // function extractCountries(datas, key) {
  //   let arr = [];
  //   for (let transaction of datas) {
  //     arr.push(transaction[key]);
  //   }
  //   return arr;
  // }
  //
  // console.log(
  //   extractCountries(SCORED_DATA, 'currencycode')
  //     .concat(extractCountries(SCORED_DATA, 'currencycode'))
  //     .sort()
  //     .filter((item, pos, ary) => !pos || item != ary[pos - 1])
  // );


  /* Draw chart */

};
