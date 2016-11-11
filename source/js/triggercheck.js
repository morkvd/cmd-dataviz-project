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

function triggerCheck() {
  $trigger.removeClass('is-active');
  $(this).addClass('is-active');
  const selectedCheck = $(this).attr('data-for').substring(6, 7) - 1;
  checkTitle[0].innerHTML = checkInfo[selectedCheck].title;
  checkDescription[0].innerHTML = checkInfo[selectedCheck].description;
  CURRENTLY_SELECTED_CHECK = checkInfo[selectedCheck].check;
  drawBarChart('.horizontalbarchart', TOTAL_DATA.sort((left, right) => right.total - left.total), FRAUD_THRESHOLD);
  // drawBars();
}

$trigger.click(triggerCheck);

$(function() {
  checkTitle[0].innerHTML = checkInfo[0].title;
  checkDescription[0].innerHTML = checkInfo[0].description;
});
