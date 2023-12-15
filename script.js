document.getElementById("calculate").addEventListener("click", function () {
    const optionType = document.getElementById("option-type").value;
    const stockPrice = parseFloat(document.getElementById("stock-price").value);
    const strikePrice = parseFloat(document.getElementById("strike-price").value);
    const timeToExpiration = parseFloat(document.getElementById("time-to-expiration").value);
    const volatility = parseFloat(document.getElementById("volatility").value);
    const riskFreeRate = parseFloat(document.getElementById("interest-rate").value);
    const dividendYield = parseFloat(document.getElementById("dividend").value);
    const borrowCost = parseFloat(document.getElementById("borrow-cost").value);
    const pricingMethod = document.getElementById("pricing-method").value;

    let result;

    switch (pricingMethod) {
        case "black-scholes-discrete":
            // Assign the result object using Black-Scholes (Discrete)
            result = calculateBlackScholesDiscrete(optionType, stockPrice, strikePrice, timeToExpiration, volatility, riskFreeRate, dividendYield, borrowCost);
            break;
        case "black-scholes-continuous":
            // Assign the result object using Black-Scholes (Continuous)
            result = calculateBlackScholesContinuous(optionType, stockPrice, strikePrice, timeToExpiration, volatility, riskFreeRate, dividendYield, borrowCost);
            break;
        default:
            alert("Invalid pricing method");
            return; // Exit the function if the pricing method is invalid
    }

    // Display the calculated option price and Greeks using the result object
    document.getElementById("option-price").textContent = result.optionPrice;
    document.getElementById("delta").textContent = result.delta;
    document.getElementById("gamma").textContent = result.gamma;
    document.getElementById("theta").textContent = result.theta;
    document.getElementById("vega").textContent = result.vega;
    document.getElementById("rho").textContent = result.rho;
});

// The cumulative distribution function for a standard normal distribution
function normDist(x) {
  const a1 = 0.31938153;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0) {
      const k = 1.0 / (1.0 + p * x);
      return (1.0 - c * Math.exp(-x * x / 2.0) * k *
          (k * (k * (k * (k * a5 + a4) + a3) + a2) + a1));
  } else {
      return 1.0 - normDist(-x);
  }
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
      theta = 1/365 * (-stockPrice * normPDF(d1) * volatility * Math.exp(-dividendYield * timeToExpiration) / (2 * Math.sqrt(timeToExpiration)) - adjustedRiskFreeRate * strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(d2) + dividendYield * stockPrice * Math.exp(-dividendYield * timeToExpiration) * normDist(d1));
      vega = 0.01 * stockPrice * Math.exp(-dividendYield * timeToExpiration) * Math.sqrt(timeToExpiration) * normPDF(d1);
      rho = 0.01 * strikePrice * timeToExpiration * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(d2);
    } else if (optionType === "put") {
      var putDelta = -Math.exp(-dividendYield * timeToExpiration) * normDist(-d1);
      delta = putDelta;
      gamma = normPDF(d1) * Math.exp(-dividendYield * timeToExpiration) / (stockPrice * volatility * Math.sqrt(timeToExpiration));
      theta = 1/365 * (-stockPrice * normPDF(d1) * volatility * Math.exp(-dividendYield * timeToExpiration) / (2 * Math.sqrt(timeToExpiration)) + adjustedRiskFreeRate * strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(-d2) - dividendYield * stockPrice * Math.exp(-dividendYield * timeToExpiration) * normDist(-d1));
      vega = 0.01 * stockPrice * Math.exp(-dividendYield * timeToExpiration) * Math.sqrt(timeToExpiration) * normPDF(d1);
      rho = 0.01 * -strikePrice * timeToExpiration * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(-d2);
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

  function calculateBlackScholesDiscrete(optionType, stockPrice, strikePrice, timeToExpiration, volatility, riskFreeRate, dividendYield, borrowCost) {
    // Adjust the risk-free rate to include the borrow cost
    var adjustedRiskFreeRate = riskFreeRate - borrowCost;

    // Convert continuous dividend yield to discrete dividends (assuming quarterly payments)
    var quarterlyDividend = stockPrice * dividendYield / 4;
    var discreteDividends = [];
    for (var i = 1; i <= 4; i++) {
        var timeToDividend = i * 0.25;
        // Ensure the dividend payment is within the option's time to expiration
        if (timeToDividend <= timeToExpiration) {
            discreteDividends.push({ amount: quarterlyDividend, timeToDividend: timeToDividend });
        }
    }

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
        theta = 1/365 * (-adjustedStockPrice * normPDF(d1) * volatility * Math.exp(-dividendYield * timeToExpiration) / (2 * Math.sqrt(timeToExpiration)) - adjustedRiskFreeRate * strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(d2) + dividendYield * adjustedStockPrice * Math.exp(-dividendYield * timeToExpiration) * normDist(d1));
        vega = 0.01 * adjustedStockPrice * Math.exp(-dividendYield * timeToExpiration) * Math.sqrt(timeToExpiration) * normPDF(d1);
        rho = 0.01 * strikePrice * timeToExpiration * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(d2);
      } else if (optionType === "put") {
        var putDelta = -Math.exp(-dividendYield * timeToExpiration) * normDist(-d1);
        delta = putDelta;
        gamma = normPDF(d1) * Math.exp(-dividendYield * timeToExpiration) / (adjustedStockPrice * volatility * Math.sqrt(timeToExpiration));
        theta = 1/365 * (-adjustedStockPrice * normPDF(d1) * volatility * Math.exp(-dividendYield * timeToExpiration) / (2 * Math.sqrt(timeToExpiration)) + adjustedRiskFreeRate * strikePrice * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(-d2) - dividendYield * adjustedStockPrice * Math.exp(-dividendYield * timeToExpiration) * normDist(-d1));
        vega = 0.01 * stockPrice * Math.exp(-dividendYield * timeToExpiration) * Math.sqrt(timeToExpiration) * normPDF(d1);
        rho = 0.01 * -strikePrice * timeToExpiration * Math.exp(-adjustedRiskFreeRate * timeToExpiration) * normDist(-d2);
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