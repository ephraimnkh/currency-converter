// Used to setup use of dotenv
require('dotenv').config();
// Modules required for server
const http = require('http');
const express = require('express');
const axios = require('axios');
const ejs = require('ejs');
const cookie = require('cookie');


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup the view engine to use Embedded JS (ejs)
app.engine('html', ejs.renderFile);
app.set('view-engine', 'html');

// setup the static assets directories 
app.use(express.static('images'));
app.use(express.static('css'));
app.use(express.static('js'));
app.use(express.static('node_modules'));

const url = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGERATE_API_KEY}`;

let staticCurrencyCodes;

// Get all supported currency codes
axios.get(url + '/codes').then((codesResponse) => {
    staticCurrencyCodes = codesResponse.data.supported_codes;
}).catch((error) => {
    console.error(`Error getting all supported currency codes: ${error}`);
});

// staticCurrencyCodes receives an array containing all 160 support currences. 
// Each supported currency is an array itself containing the currency code and
// the full currency name as the two array values.
// Examples
// ["USD", "United States Dollar"],
// ...
// ["ZAR","South African Rand"],

app.get('/', (req, res) => {
    let cookies = cookie.parse(req.headers.cookie || '');
    let currentTheme = cookies.theme;
    let cssFile = currentTheme ? (currentTheme === 'light' ? 'currency-converter.css' : 'currency-converter-dark.css') : 'currency-converter.css'; // incase no theme in cookie yet then set to light
    // Default From and To currency will be USDZAR.
    // Get currency conversion data from exchangerate-api and send it in conversionRate.
    axios.get(url + '/pair/USD/ZAR')
        .then(function (conversionResponse) {
            if (conversionResponse.data.result == 'success') {
                res.render('currency-converter.html', {
                    currencyCodes: staticCurrencyCodes,
                    fromCurrency: 'USD',
                    fromCurrencyText: "United States Dollar",
                    toCurrency: 'ZAR',
                    toCurrencyText: "South African Rand",
                    fromValue: 1,
                    conversionRate: conversionResponse.data.conversion_rate,
                    lastTimeUpdate: conversionResponse.data.time_last_update_utc, // when last was the data updated.
                    cssFile: cssFile
                });
            } else if (conversionResponse.data.result == 'error') {
                console.error(`Currency Conversion, Error Type: ${conversionResponse.data['error-type']}`);
            }
        })
        .catch(function (error) {
            console.error(`Error getting USDZAR conversion data: ${error}`)
        });
});

app.post('/currency-converter/:fromCurrency/:toCurrency', (req, res) => {
    axios.get(url + '/pair/' + req.params.fromCurrency + '/' + req.params.toCurrency)
        .then(function (conversionResponse) {
            if (conversionResponse.data.result == 'success') {
                // In order to get a currency code's full text I use the findIndex method on the array with all the codes
                // The function passed to findIndex finds the correct text by returning the index of the code that includes 
                // the currency code received from the frontend in req.params.fromCurrency or req.params.toCurrency
                // once that index is received and we are now referencing that code then at the end the [1] is used to get 
                // the text for the referenced code as the text is the second parameter of all codes.
                let fromCurrencyText = staticCurrencyCodes[staticCurrencyCodes.findIndex((code) => { return code.includes(req.params.fromCurrency) })][1];
                let toCurrencyText = staticCurrencyCodes[staticCurrencyCodes.findIndex((code) => { return code.includes(req.params.toCurrency) })][1]
                res.json({ conversionRate: conversionResponse.data.conversion_rate, fromCurrencyText: fromCurrencyText, toCurrencyText: toCurrencyText, lastTimeUpdate: conversionResponse.data.time_last_update_utc });
            } else if (conversionResponse.data.result == 'error') {
                let message = conversionResponse.data['error-type'];
                res.json({ error: message });
            }
        })
        .catch(function (error) {
            res.json({ error: `Error getting currency conversion data: ${error}` });
        });
});

app.get('/switch-theme', async function (req, res) {
    let cookies = cookie.parse(req.headers.cookie || '');
    let currentTheme = cookies.theme;
    let day = new Date();
    day = day.setDate(day + 365); // Make cookie expire in a year.
    switch (currentTheme) {
        case "light": res.cookie("theme", "dark", { expires: day }); break;
        case "dark": res.cookie("theme", "light", { expires: day }); break;
        default: res.cookie("theme", "dark", { expires: day });
    }
    res.redirect('back');
});

app.get('/*', (req, res) => {
    res.status(404).render("404.html");
});

// setup http server
http.createServer(app).listen(8888, () => {
    console.log(`Currency Converter is running at http://localhost:8888`);
});