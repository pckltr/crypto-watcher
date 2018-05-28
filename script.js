/*jshint esversion: 6 */

var UserInput = {
    // total invested in usd
    invested: 100,
    // not invested yet
    usd: 0, 
    eur: 0,
    // cryptocurrency and the amount of it
    myPortfolio: [
        { name: 'bitcoin', units: 1 },
        { name: 'dogecoin', units: 1337 }
    ]
};

(function(UserInput) {
    var invested,
        total,
        tableContent,
        euro,
        usd,
        eurToUsd,
        loadRate = function() {
            var xhttp = new XMLHttpRequest();
            invested = UserInput.invested;
            total = 0;
            tableContent = '<tr><th>Name</th><th>Price (USD)</th><th>1 hour (%)</th><th>24 hours (%)</th><th>7 days (%)</th><th>Units</th><th>Total (USD)</th></tr>';

            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var data = JSON.parse(this.responseText);
                    euro = UserInput.eur;
                    usd = UserInput.usd;
                    eurToUsd = data.rates.USD;
                    tableContent += `<tr><td>dollar (USD)</td><td>$1</td><td></td><td></td><td></td><td>${usd} USD</td><td>$${Number(usd).toFixed(2)}</td></tr>`;
                    tableContent += `<tr><td>euro (EUR)</td><td>$${eurToUsd}</td><td></td><td></td><td></td><td>${euro} EUR</td><td>$${Number(data.rates.USD*euro).toFixed(2)}</td></tr>`;
                    invested = invested + (data.rates.USD * euro);
                    total = usd + (data.rates.USD * euro);
                }

            };

            xhttp.open("GET", "https://api.fixer.io/latest?base=EUR", true);
            xhttp.send();
        },
        loadData = function() {
            var xhttp = new XMLHttpRequest(),
                // add your currency units here
                myCurrency = UserInput.myPortfolio,
                // array with currency names
                currencyNames = myCurrency.map(obj => obj.name),
                // object with name as key and units as value
                unitsObj = Object.assign(...myCurrency.map(obj => {
                    var newObj = {
                        [obj.name]: obj.units
                    };
                    return newObj;
                })),
                money;

            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var data = JSON.parse(this.responseText),
                        // extract my currency from response data
                        newData = data.filter(obj => {

                            if (currencyNames.find(smth => smth === obj.id)) {
                                return true;
                            } else {
                                return false;
                            }

                        });
                    // create object with response data and more
                    newData = newData.map(obj => {

                        var id, price_usd, symbol, percent_change_1h, percent_change_24h, percent_change_7d;
                        ({ id, price_usd, symbol, percent_change_1h, percent_change_24h, percent_change_7d } = obj);
                        var newObj = {
                            id,
                            price_usd,
                            symbol,
                            percent_change_1h,
                            percent_change_24h,
                            percent_change_7d,
                            units: unitsObj[obj.id],
                            total_usd: price_usd * unitsObj[obj.id],
                            total_usd_decimal: Number(price_usd * unitsObj[obj.id]).toFixed(2)
                        };
                        return newObj;

                    });
                    // create an array of total for each currency
                    money = newData.map(obj => obj.total_usd);
                    // compute portfolio total value
                    money.forEach(entry => total += entry);
                    // add the content in the table
                    for (var i = 0; i < newData.length; i++) {
                        tableContent += `<tr><td>${newData[i].id} (${newData[i].symbol})</td>`;
                        tableContent += `<td>$${Number(newData[i].price_usd).toFixed(8)}</td>`;
                        tableContent += `<td class="${newData[i].percent_change_1h > 0 ? 'up' : 'down'} ${newData[i].percent_change_1h > 50 ? 'party' : ''}">${newData[i].percent_change_1h}%</td>`;
                        tableContent += `<td class="${newData[i].percent_change_24h > 0 ? 'up' : 'down'} ${newData[i].percent_change_24h > 50 ? 'party' : ''}">${newData[i].percent_change_24h}%</td>`;
                        tableContent += `<td class="${newData[i].percent_change_7d > 0 ? 'up' : 'down'} ${newData[i].percent_change_7d > 50 ? 'party' : ''}">${newData[i].percent_change_7d}%</td>`;
                        tableContent += `<td>${Number(newData[i].units).toFixed(8)} ${newData[i].symbol}</td>`;
                        tableContent += `<td>$${newData[i].total_usd_decimal}</td></tr>`;
                    }
                    // add the stats in the page
                    document.getElementById('total').innerHTML = `<div>Total</div><div class="number">$${Number(total).toFixed(2)}</div><div class="number">€${Number(total/eurToUsd).toFixed(2)}</div>`;
                    document.getElementById('invested').innerHTML = `<div>Invested</div><div class="number">$${Number(invested).toFixed(2)}</div><div class="number">€${Number(invested/eurToUsd).toFixed(2)}</div>`;
                    document.getElementById('profit').innerHTML = `<div>Profit</div><div class="number">$${Number(total-invested).toFixed(2)}</div><div class="number">€${Number((total-invested)/eurToUsd).toFixed(2)}</div>`;
                    document.getElementById('profit-percentage').innerHTML = `<div>Profit (%)</div><div class="number">${Number(((total-invested)*100)/invested).toFixed(2)}%</div>`;
                    // add the content in the table element
                    document.getElementById('table').innerHTML = tableContent;
                }
            };
            xhttp.open("GET", "https://api.coinmarketcap.com/v1/ticker/?limit=1000", true);
            xhttp.send();
        },
        intervalId,
        autoRefresh = function() {
            if (document.getElementById('auto-refresh').checked) {
                intervalId = setInterval(loadBoth, 10000);
            } else {
                clearInterval(intervalId);
            }
        },
        loadBoth = function() {
            loadRate();
            loadData();
        };
    loadBoth();
    document.getElementById('refresh').addEventListener('click', loadBoth);
    document.getElementById('auto-refresh').addEventListener('change', autoRefresh);
})(UserInput);