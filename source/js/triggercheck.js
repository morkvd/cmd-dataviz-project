// Change check info

const checkInfo = [
  {
    "title": "The amount does not coincide with the average amount",
    "description": "<p>Each merchant usually sells in a specific range of products. Fraudsters want to get the most out of their transactions and therefore have amounts that are much higher than the average. However, keep in mind that what is a “normal” region for amounts to be in can differ between merchants.</p>"
  },
  {
    "title": "Shopper email or card number is used in quick succession",
    "description": "<p>Velocity checks allow merchants to set velocity thresholds on various customer attributes, controlling how often a customer can attempt transactions. These checks are intended to identify high-speed fraud attacks. To best utilize these checks merchants need to understand the behavior of their shoppers. The average number of transactions by a good user varies significantly across merchants.</p><p>When the same email address or card number is used often within a small period, this is a good case for fraud.</p>"
  },
  {
    "title": "Shopper country is high risk",
    "description": "<p>Some countries pose a high risk for fraud, regardless of what the country of the currency or issuing country is, such as Mexico or Bulgaria.</p>"
  },
  {
    "title": "Different countries used by the same shopper email address",
    "description": "<p>Fraudsters often have a fraud profile that spans multiple regions. When one shopper email address or card number gets associated with multiple countries, this is an indication of possible fraud.</p>"
  },
  {
    "title": "Shopper country differs from issuing country and/or country of currency",
    "description": "<p>This risk check is triggered when a transaction has the shopper country different from the issuing country (of the card) or that is different from the country from which the currency comes.</p>"
  },
  {
    "title": "Card number already used by other shopper (shopper email)",
    "description": "<p>Fraudsters often create multiple accounts and attempt to use the same compromised account with different techniques and attack merchants. This check is aimed at identifying when a card number is being used across multiple accounts.</p><p>Note that there are some legitimate cases in which this would occur:</p><ul><li>The user may have multiple accounts.</li><li>It may be a shared card in a family or business setting</li></ul>"
  },
  {
    "title": "Transaction time check",
    "description": "<p>Most merchants notice that fraudsters tend to visit their site during certain parts of the day. It is not uncommon, for example, for fraud to spike during the night hours while legitimate transactions are limited.</p>"
  }
];

const $trigger = $('.triggerCheck');
const checkTitle = document.getElementsByClassName('header-check');
const checkDescription = document.getElementsByClassName('description-check');

function triggerCheck() {
  $trigger.removeClass('is-active');
  $(this).addClass('is-active');
  const selectedCheck = $(this).attr('data-for').substring(6, 7) - 1;
  checkTitle[0].innerHTML = checkInfo[selectedCheck].title;
  checkDescription[0].innerHTML = checkInfo[selectedCheck].description;
}

$trigger.click(triggerCheck);

$(function() {
  checkTitle[0].innerHTML = checkInfo[0].title;
  checkDescription[0].innerHTML = checkInfo[0].description;
});