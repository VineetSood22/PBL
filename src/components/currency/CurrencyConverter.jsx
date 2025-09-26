import React, { useState } from 'react';
import { getExchangeRate } from '../../Service/CurrencyApi.jsx';

const CurrencyConverter = () => {
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [convertedAmount, setConvertedAmount] = useState(null);

  const convertCurrency = async () => {
    const rate = await getExchangeRate(fromCurrency, toCurrency);
    if (rate) {
      setConvertedAmount(amount * rate);
    }
  };

  return (
    <div className="currency-converter bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Currency Converter</h2>
      <div className="mb-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="p-2 border rounded"
        />
        <select
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
          className="ml-2 p-2 border rounded"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
        </select>
      </div>
      <div className="mb-2">
        <select
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
        </select>
      </div>
      <button
        onClick={convertCurrency}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Convert
      </button>
      {convertedAmount && (
        <p className="mt-2">Converted Amount: {convertedAmount.toFixed(2)} {toCurrency}</p>
      )}
    </div>
  );
};

export default CurrencyConverter;
