// app/api/correlation/route.js
import { NextResponse } from 'next/server';
import {
  getCurrencyStrengthSeries,
  calculateCorrelation,
} from '../../../lib/correlationUtils';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const currenciesString = searchParams.get('currencies');
  const timeframe = searchParams.get('timeframe');
  const period = searchParams.get('period');

  const currencies = currenciesString ? currenciesString.split(',') : [];

  if (!currencies || currencies.length < 2) {
    return NextResponse.json(
      { error: 'Please select at least two currencies.' },
      { status: 400 }
    );
  }

  try {
    const strengthData = await getCurrencyStrengthSeries(
      currencies,
      timeframe,
      parseInt(period)
    );
    const correlationMatrix = calculateCorrelation(strengthData);

    const scaledCorrelationMatrix = {};
    for (const c1 in correlationMatrix) {
      scaledCorrelationMatrix[c1] = {};
      for (const c2 in correlationMatrix[c1]) {
        scaledCorrelationMatrix[c1][c2] = correlationMatrix[c1][c2] * 10;
      }
    }

    return NextResponse.json(scaledCorrelationMatrix, { status: 200 });
  } catch (error) {
    console.error('Error fetching or calculating currency correlation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch or calculate currency correlation data.' },
      { status: 500 }
    );
  }
}
