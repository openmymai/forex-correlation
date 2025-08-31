// components/CorrelationTable.js
import React from 'react';

const CorrelationTable = ({ data, currencies }) => {
  if (!data || Object.keys(data).length === 0) {
    return <p>ไม่มีข้อมูลความสัมพันธ์ที่จะแสดง</p>;
  }

  const sortedCurrencies = [...currencies].sort();

  const getCorrelationColor = (value) => {
    if (value === null || isNaN(value)) return '#f0f0f0';

    if (value > 7) return '#28a745';
    if (value > 3) return '#6fbb7a';
    if (value > 0) return '#aed8b6';
    if (value === 0) return '#f0f0f0';
    if (value < -7) return '#dc3545';
    if (value < -3) return '#e67d86';
    if (value < 0) return '#f2b8bd';
    return '#f0f0f0';
  };

  return (
    <div className='correlation-table-container'>
      <table className='correlation-table'>
        <thead>
          <tr>
            <th></th>

            {sortedCurrencies.map((currency) => (
              <th key={currency}>{currency}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedCurrencies.map((rowCurrency) => (
            <tr key={rowCurrency}>
              <th>{rowCurrency}</th>

              {sortedCurrencies.map((colCurrency) => {
                const correlationValue = data[rowCurrency]
                  ? data[rowCurrency][colCurrency]
                  : null;
                const displayValue =
                  correlationValue !== null ? correlationValue.toFixed(2) : '-';
                const cellColor = getCorrelationColor(correlationValue);

                return (
                  <td
                    key={`${rowCurrency}-${colCurrency}`}
                    style={{ backgroundColor: cellColor }}
                  >
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .correlation-table-container {
          overflow-x: auto;
          width: 100%;
          margin-top: 2rem;
        }
        .correlation-table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
          font-size: 0.9rem;
        }
        .correlation-table th,
        .correlation-table td {
          border: 1px solid #ddd;
          padding: 8px;
          min-width: 70px;
        }
        .correlation-table th {
          background-color: #e9ecef;
          font-weight: bold;
          color: #333;
        }
        .correlation-table td {
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default CorrelationTable;
