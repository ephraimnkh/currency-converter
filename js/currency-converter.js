// Gets the currency information such as the conversion rate of the from and to currency and the actual from and to currency from an element.
const currencyConverterData = document.querySelector('#currency-converter-data');
// The conversion rate and from and to currency are accessed from the element containing them '#currency-converter-data'
// using a technique that uses dataset which returns all the values the element has stored
// in data-* attributes. All hyphens in data-* attribute name are converted to camelCase for access.
let conversionRateData = currencyConverterData.dataset.conversionRate;
let fromCurrencyData = currencyConverterData.dataset.fromCurrency;
let toCurrencyData = currencyConverterData.dataset.toCurrency;
let fromValue = document.getElementById("fromValue");
let toValue = document.getElementById("toValue");
let base = document.getElementById("base");
let secondary = document.getElementById("secondary");
let updateTime = document.getElementById("update-time");

// Default focus is the from field as typically you want to convert currencies from the 'from field' to the currency in the 'to field'.
let focus = "from";
// If the user changes the value in the 'from' or 'to' input field the focus for conversion will change accordingly between 'from' and 'to'.
focusChange = (newFocus) => {
    focus = newFocus; // will either be 'from' or 'to'
}

convert = () => {
    // If the user is entering values in the from field it means they want to convert the from currency 
    // to the to currency so calculations are ran accordingly and the respective field is updated.
    if (focus === 'from') {
        // Check if the from field actually has anything in it since this convert() function runs
        // on every key press, if something is in the field then do calculation if not then insert
        // 0 in the to currency field as nothing is there to calculate.
        if (fromValue.value.length > 0) {
            toValue.value = (fromValue.value * conversionRateData).toFixed(2);
        } else {
            toValue.value = 0;
        }
    }
    // If the user is entering values in the to field it means they want to convert the to currency
    // to the from currency so calculations are ran accordingly and the respective field is updated.
    if (focus === 'to') {
        // Check if the to field actually has anything in it since this convert() function runs
        // on every key press, if something is in the field then do calculation if not then insert
        // 0 in the from currency field as nothing is there to calculate.
        if (toValue.value.length > 0) {
            fromValue.value = (toValue.value / conversionRateData).toFixed(2);
        } else {
            fromValue.value = 0;
        }
    }
}
// In the case that currencies are changed then the page must fetch the new conversion rate, so the server is sent all 
// relevant information from the conversion input fields and the current focus field
currencyChange = () => {
    fetch(`/currency-converter/${fromCurrency.value}/${toCurrency.value}`, {
        method: 'POST'
    })
        .then(res => res.json())
        .then(obj => {
            if (obj.error) {
                //Notify
                $.notify({
                    message: `Error: ${JSON.stringify(obj.error)}`,
                }, {
                    type: 'danger',
                    placement: {
                        from: "top",
                        align: "right"
                    },
                    time: 5000,
                });
            } else {
                conversionRateData = obj.conversionRate;
                // Update Texts for converter
                if (focus == 'from') {
                    base.innerHTML = `${fromValue.value} ${obj.fromCurrencyText} equals`;
                    secondary.innerHTML = `${(fromValue.value * conversionRateData).toFixed(2)}
                            ${obj.toCurrencyText}`;
                }
                if (focus == 'to') {
                    base.innerHTML =
                        `${(toValue.value / conversionRateData).toFixed(2)} ${obj.fromCurrencyText} equals`;
                    secondary.innerHTML = `${toValue.value} ${obj.toCurrencyText}`;
                }
                updateTime.innerHTML =
                    `Last Updated: ${obj.lastTimeUpdate.toString().substring(0, 22)} UTC`;
                convert();
            }
        });

}