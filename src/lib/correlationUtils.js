// lib/correlationUtils.js
import 'server-only';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const CURRENCY_PAIR_MAP = {
  EUR: { pair: 'EURUSD', invert: false },
  USD: { pair: 'EURUSD', invert: true },
  JPY: { pair: 'USDJPY', invert: true },
  GBP: { pair: 'GBPUSD', invert: false },
  AUD: { pair: 'AUDUSD', invert: false },
  CAD: { pair: 'USDCAD', invert: true },
  CHF: { pair: 'USDCHF', invert: true },
  NZD: { pair: 'NZDUSD', invert: false },
};

async function fetchAlphaVantageData(fromSymbol, toSymbol, timeframe) {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error('Alpha Vantage API Key is not set in .env.local');
  }

  let functionName = '';
  switch (timeframe) {
    case 'daily':
      functionName = 'FX_DAILY';
      break;
    case 'hourly':
      console.warn(
        'Hourly data for Forex is not directly available in Alpha Vantage FX_DAILY. Using daily for now.'
      );
      functionName = 'FX_DAILY';
      break;
    default:
      functionName = 'FX_DAILY';
  }

  const url = `https://www.alphavantage.co/query?function=${functionName}&from_symbol=${fromSymbol}&to_symbol=${toSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(
        `Alpha Vantage API request failed with status: ${response.status}`
      );
    }
    const json = await response.json();

    if (json['Error Message']) {
      throw new Error(`Alpha Vantage API Error: ${json['Error Message']}`);
    }
    if (json['Note']) {
      console.warn(`Alpha Vantage API Note: ${json['Note']}`);
    }

    const timeSeriesKey =
      functionName === 'FX_DAILY' ? 'Time Series FX (Daily)' : null;

    if (!timeSeriesKey || !json[timeSeriesKey]) {
      console.warn(
        `No data found for ${fromSymbol}/${toSymbol} with timeframe ${timeframe}. Response:`,
        json
      );
      return [];
    }

    const dailyData = json[timeSeriesKey];

    const dates = Object.keys(dailyData).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    return dates.map((date) => parseFloat(dailyData[date]['4. close']));
  } catch (error) {
    console.error(
      `Error fetching data for ${fromSymbol}/${toSymbol}:`,
      error.message
    );
    throw error;
  }
}

export async function getCurrencyStrengthSeries(currencies, timeframe, period) {
  const strengthData = {};
  const fetchPromises = [];
  const currencyToPairMap = {};

  for (const currency of currencies) {
    const mapEntry = CURRENCY_PAIR_MAP[currency];
    if (!mapEntry) {
      console.warn(
        `No representative pair defined for currency: ${currency}. Skipping.`
      );
      strengthData[currency] = Array(period).fill(0);
      continue;
    }

    const fromSymbol = mapEntry.pair.substring(0, 3);
    const toSymbol = mapEntry.pair.substring(3, 6);

    fetchPromises.push(
      fetchAlphaVantageData(fromSymbol, toSymbol, timeframe)
        .then((prices) => ({ currency, prices, invert: mapEntry.invert }))
        .catch((error) => {
          console.error(
            `Failed to get data for ${currency} via ${mapEntry.pair}:`,
            error.message
          );
          return { currency, prices: [], invert: mapEntry.invert, error: true };
        })
    );
  }

  const results = await Promise.all(fetchPromises);

  for (const result of results) {
    if (result.error || result.prices.length < 2) {
      strengthData[result.currency] = Array(period).fill(0);
      continue;
    }

    const returns = [];
    for (let i = 1; i < result.prices.length; i++) {
      const logReturn = Math.log(result.prices[i] / result.prices[i - 1]);
      returns.push(result.invert ? -logReturn : logReturn);
    }

    strengthData[result.currency] = returns.slice(-period);
  }

  const minLength = Math.min(
    ...Object.values(strengthData).map((arr) => arr.length)
  );
  for (const currency in strengthData) {
    strengthData[currency] = strengthData[currency].slice(-minLength);
  }

  return strengthData;
}

export function calculateCorrelation(strengthData) {
  const currencies = Object.keys(strengthData);
  const correlationMatrix = {};

  if (currencies.length < 2) {
    return {};
  }

  const minLength = Math.min(
    ...Object.values(strengthData).map((arr) => arr.length)
  );
  for (const currency in strengthData) {
    strengthData[currency] = strengthData[currency].slice(0, minLength);
  }

  for (let i = 0; i < currencies.length; i++) {
    const curr1 = currencies[i];
    correlationMatrix[curr1] = {};
    for (let j = 0; j < currencies.length; j++) {
      const curr2 = currencies[j];

      if (curr1 === curr2) {
        correlationMatrix[curr1][curr2] = 1;
      } else {
        const x = strengthData[curr1];
        const y = strengthData[curr2];

        if (x.length === 0 || y.length === 0) {
          correlationMatrix[curr1][curr2] = 0;
          continue;
        }

        const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
        const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;

        let numerator = 0;
        for (let k = 0; k < x.length; k++) {
          numerator += (x[k] - meanX) * (y[k] - meanY);
        }

        let sumSqX = 0;
        let sumSqY = 0;
        for (let k = 0; k < x.length; k++) {
          sumSqX += Math.pow(x[k] - meanX, 2);
          sumSqY += Math.pow(y[k] - meanY, 2);
        }

        const denominator = Math.sqrt(sumSqX * sumSqY);

        if (denominator === 0) {
          correlationMatrix[curr1][curr2] = 0;
        } else {
          const correlation = numerator / denominator;
          correlationMatrix[curr1][curr2] = correlation;
        }
      }
    }
  }
  return correlationMatrix;
}
