// app/page.js
'use client';

import { useState, useEffect } from 'react';
import CorrelationTable from '../components/CorrelationTable';

export default function Home() {
  const [correlationData, setCorrelationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCurrencies, setSelectedCurrencies] = useState([
    'EUR',
    'USD',
    'JPY',
    'GBP',
    'AUD',
    'CAD',
    'CHF',
  ]);
  const [timeframe, setTimeframe] = useState('daily');
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchCorrelation = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/correlation?currencies=${selectedCurrencies.join(
            ','
          )}&timeframe=${timeframe}&period=${period}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCorrelationData(data);
      } catch (e) {
        setError(e.message);
        console.error('Failed to fetch correlation data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchCorrelation();
  }, [selectedCurrencies, timeframe, period]);

  return (
    <div className='container'>
      {/* Head component ถูกแทนที่ด้วย metadata ใน layout.js */}
      <main>
        <h1 className='title'>Forex Currency Strength Correlation Matrix</h1>

        <p className='description'>
          แสดงความสัมพันธ์ของความแข็งแกร่งสกุลเงินเดี่ยว (ค่า -10 ถึง 10)
        </p>

        <div className='controls'>
          <label>
            เลือกสกุลเงิน:
            <select
              multiple
              value={selectedCurrencies}
              onChange={(e) =>
                setSelectedCurrencies(
                  Array.from(e.target.selectedOptions, (option) => option.value)
                )
              }
            >
              <option value='EUR'>EUR</option>
              <option value='USD'>USD</option>
              <option value='JPY'>JPY</option>
              <option value='GBP'>GBP</option>
              <option value='AUD'>AUD</option>
              <option value='CAD'>CAD</option>
              <option value='CHF'>CHF</option>
              <option value='NZD'>NZD</option>
              {/* เพิ่มสกุลเงินอื่นๆ ที่ต้องการ */}
            </select>
          </label>
          <label>
            Timeframe:
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value='daily'>Daily</option>
              <option value='hourly'>Hourly</option>
              {/* เพิ่ม Timeframe อื่นๆ หาก API รองรับ */}
            </select>
          </label>
          <label>
            Period (แท่งเทียน):
            <input
              type='number'
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              min='10'
              max='200'
            />
          </label>
        </div>

        {loading && <p>กำลังโหลดข้อมูล...</p>}
        {error && <p className='error'>เกิดข้อผิดพลาด: {error}</p>}
        {correlationData && (
          <CorrelationTable
            data={correlationData}
            currencies={selectedCurrencies}
          />
        )}
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-family: sans-serif;
          background-color: #f4f7f6;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 960px;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 3rem;
          text-align: center;
          color: #333;
        }

        .description {
          line-height: 1.5;
          font-size: 1.2rem;
          text-align: center;
          color: #555;
          margin-bottom: 2rem;
        }

        .controls {
          display: flex;
          gap: 20px;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .controls label {
          display: flex;
          flex-direction: column;
          font-size: 0.9rem;
          color: #444;
        }

        .controls select,
        .controls input {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-top: 5px;
          min-width: 120px;
        }

        .controls select[multiple] {
          min-height: 100px;
        }

        .error {
          color: red;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
