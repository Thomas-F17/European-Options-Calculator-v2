document.getElementById("calculate").addEventListener("click", function () {
    const optionType = document.getElementById("option-type").value;
    const stockPrice = parseFloat(document.getElementById("stock-price").value);
    const strikePrice = parseFloat(document.getElementById("strike-price").value);
    const timeToExpiration = parseFloat(document.getElementById("time-to-expiration").value);
    const volatility = parseFloat(document.getElementById("volatility").value);
    const interestRate = parseFloat(document.getElementById("interest-rate").value);
    const dividend = parseFloat(document.getElementById("dividend").value);
    const borrowCost = parseFloat(document.getElementById("borrow-cost").value);
    const pricingMethod = document.getElementById("pricing-method").value;

    // Implement option pricing logic based on the selected pricing method
    let optionPrice = 0;
    let delta = 0;
    let gamma = 0;
    let theta = 0;
    let vega = 0;
    let rho = 0;

    switch (pricingMethod) {
        case "black-scholes-discrete":
            // Calculate option price and Greeks using Black-Scholes (Discrete)
            [optionPrice, delta, gamma, theta, vega, rho] = calculateBlackScholesDiscrete(optionType, stockPrice, strikePrice, timeToExpiration, volatility, interestRate, dividend);
            break;
        case "black-scholes-continuous":
            // Calculate option price and Greeks using Black-Scholes (Continuous)
            [optionPrice, delta, gamma, theta, vega, rho] = calculateBlackScholesContinuous(optionType, stockPrice, strikePrice, timeToExpiration, volatility, interestRate, dividend);
            break;
        default:
            optionPrice = "Invalid pricing method";
            break;
    }

    // Display the calculated option price and Greeks
    document.getElementById("option-price").textContent = optionPrice.toFixed(2);
    document.getElementById("delta").textContent = delta.toFixed(4);
    document.getElementById("gamma").textContent = gamma.toFixed(4);
    document.getElementById("theta").textContent = theta.toFixed(4);
    document.getElementById("vega").textContent = vega.toFixed(4);
    document.getElementById("rho").textContent = rho.toFixed(4);
});

// The cumulative distribution function for a standard normal distribution
function normDist(x) {
    var a1, a2, a3, a4 ,a5, k;
    a1 =  0.254829592;
    a2 = -0.284496736;
    a3 =  1.421413741;
    a4 = -1.453152027;
    a5 =  1.061405429;
    k = 1.0 / (1.0 + 0.2316419 * Math.abs(x));
    var value = 1.0 - ((a1*k + a2*k*k + a3*Math.pow(k,3) + a4*Math.pow(k,4) + a5*Math.pow(k,5)) * Math.exp(-x*x / 2.0)) / Math.sqrt(2.0 * Math.PI);
    return (x < 0.0) ? 1.0 - value : value;
  }
  
  // The probability density function for a standard normal distribution
  function normPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2.0 * Math.PI);
  }  

function calculateBlackScholesContinuous(optionType, stockPrice, strikePrice, timeToExpiration, volatility, riskFreeRate, dividendYield, borrowCost) {
    // Calculate Black-Scholes (Continuous) option price, Delta, Gamma, Theta, Vega, and Rho
    // Adjust the risk-free rate to include the borrow cost
    var adjustedRiskFreeRate = riskFreeRate - borrowCost;
  
    // Calculate d1 and d2 using the adjusted risk-free rate
    var d1 = (Math.log(stockPrice / strikePrice) + (adjustedRiskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiration) / (volatility * Math.sqrt(timeToExpiration));
    var d2 = d1 - volatility * Math.sqrt(timeToExpiration);
  
    // Variables for Greeks
    var delta, gamma, theta, vega, rho;
  
    // Calculate the option price and Greeks
    if (optionType === "call") {
      var callDelta = Math.exp(-dividendYield * timeToExpiration) * normDist(d1);
      delta = callDelta;
      gamma = normPDF(d1) * Math.exp(-dividendYield * timeToExpiration) / (stockPrice * volatility * Math.sqrt(timeToExpiration));
      theta = -stockPrice * normPDF(d1) * volatility * Math.exp(-dividendYield * timeToExpiration) / (2 * Math.sqrt(timeToExpiration)) - adjustedRiskFreeRate * strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(d2) + dividendYield * stockPrice * Math.exp(-dividendYield * timeToExpiration) * normDist(d1);
      vega = stockPrice * Math.exp(-dividendYield * timeToExpiration) * Math.sqrt(timeToExpiration) * normPDF(d1);
      rho = strikePrice * timeToExpiration * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(d2);
    } else if (optionType === "put") {
      var putDelta = -Math.exp(-dividendYield * timeToExpiration) * normDist(-d1);
      delta = putDelta;
      gamma = normPDF(d1) * Math.exp(-dividendYield * timeToExpiration) / (stockPrice * volatility * Math.sqrt(timeToExpiration));
      theta = -stockPrice * normPDF(d1) * volatility * Math.exp(-dividendYield * timeToExpiration) / (2 * Math.sqrt(timeToExpiration)) + adjustedRiskFreeRate * strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(-d2) - dividendYield * stockPrice * Math.exp(-dividendYield * timeToExpiration) * normDist(-d1);
      vega = stockPrice * Math.exp(-dividendYield * timeToExpiration) * Math.sqrt(timeToExpiration) * normPDF(d1);
      rho = -strikePrice * timeToExpiration * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(-d2);
    } else {
      throw new Error("Invalid option type");
    }
  
    // Calculate the option price
    var optionPrice = (optionType === "call")
      ? stockPrice * Math.exp(-dividendYield * timeToExpiration) * normDist(d1) - strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(d2)
      : strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(-d2) - stockPrice * Math.exp(-dividendYield * timeToExpiration) * normDist(-d1);
  
    // Return the option price and Greeks
    return { optionPrice: optionPrice.toFixed(2), delta: delta.toFixed(4), gamma: gamma.toFixed(4), theta: theta.toFixed(4), vega: vega.toFixed(4), rho: rho.toFixed(4) };
  }

  function calculateBlackScholesDiscrete(optionType, stockPrice, strikePrice, timeToExpiration, volatility, riskFreeRate, dividendYield, borrowCost, discreteDividends) {
    // Calculate Black-Scholes (Discrete) option price, Delta, Gamma, Theta, Vega, and Rho
    // Adjust the risk-free rate to include the borrow cost
    var adjustedRiskFreeRate = riskFreeRate - borrowCost;
  
    // Discount the stock price by the present value of discrete dividends
    var presentValueDividends = discreteDividends.map(function(div) {
      return div.amount / Math.pow(1 + adjustedRiskFreeRate, div.timeToDividend);
    }).reduce(function(acc, val) {
      return acc + val;
    }, 0);
    var adjustedStockPrice = stockPrice - presentValueDividends;
  
    // Calculate d1 and d2 using the adjusted stock price and risk-free rate
    var d1 = (Math.log(adjustedStockPrice / strikePrice) + (adjustedRiskFreeRate + 0.5 * volatility * volatility) * timeToExpiration) / (volatility * Math.sqrt(timeToExpiration));
    var d2 = d1 - volatility * Math.sqrt(timeToExpiration);
  
    // Greeks calculations are similar to the continuous model but use adjusted stock price
    var delta, gamma, theta, vega, rho;
    if (optionType === "call") {
        var callDelta = Math.exp(-dividendYield * timeToExpiration) * normDist(d1);
        delta = callDelta;
        gamma = normPDF(d1) * Math.exp(-dividendYield * timeToExpiration) / (adjustedStockPrice * volatility * Math.sqrt(timeToExpiration));
        theta = -adjustedStockPrice * normPDF(d1) * volatility * Math.exp(-dividendYield * timeToExpiration) / (2 * Math.sqrt(timeToExpiration)) - adjustedRiskFreeRate * strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(d2) + dividendYield * adjustedStockPrice * Math.exp(-dividendYield * timeToExpiration) * normDist(d1);
        vega = adjustedStockPrice * Math.exp(-dividendYield * timeToExpiration) * Math.sqrt(timeToExpiration) * normPDF(d1);
        rho = strikePrice * timeToExpiration * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(d2);
      } else if (optionType === "put") {
        var putDelta = -Math.exp(-dividendYield * timeToExpiration) * normDist(-d1);
        delta = putDelta;
        gamma = normPDF(d1) * Math.exp(-dividendYield * timeToExpiration) / (adjustedStockPrice * volatility * Math.sqrt(timeToExpiration));
        theta = -adjustedStockPrice * normPDF(d1) * volatility * Math.exp(-dividendYield * timeToExpiration) / (2 * Math.sqrt(timeToExpiration)) + adjustedRiskFreeRate * strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(-d2) - dividendYield * adjustedStockPrice * Math.exp(-dividendYield * timeToExpiration) * normDist(-d1);
        vega = stockPrice * Math.exp(-dividendYield * timeToExpiration) * Math.sqrt(timeToExpiration) * normPDF(d1);
        rho = -strikePrice * timeToExpiration * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(-d2);
      } else {
        throw new Error("Invalid option type");
      }
  
    // Calculate the option price using the adjusted stock price
    var optionPrice = (optionType === "call")
      ? adjustedStockPrice * normDist(d1) - strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(d2)
      : strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(-d2) - adjustedStockPrice * normDist(-d1);
  
    // Return the option price and Greeks
    return { optionPrice: optionPrice.toFixed(2), delta: delta.toFixed(4), gamma: gamma.toFixed(4), theta: theta.toFixed(4), vega: vega.toFixed(4), rho: rho.toFixed(4) };
  }

  // Add event listeners for DOMContentLoaded and other events that you handle in your application
document.addEventListener('DOMContentLoaded', function() {
  // Event listener for the calculate button
  document.getElementById('calculate').addEventListener('click', function() {
  });

  // Logic for the theme switch
  var themeSwitch = document.getElementById('checkbox');
  themeSwitch.addEventListener('change', function(event) {
    if (event.target.checked) {
        document.body.classList.replace('theme-light', 'theme-dark');
    } else {
        document.body.classList.replace('theme-dark', 'theme-light');
    }
  });
});