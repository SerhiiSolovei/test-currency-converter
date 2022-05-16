import { useState, useEffect, useCallback } from 'react';
import './App.css';

const ORIGIN = 'https://api.fastforex.io';
const API_KEY = 'a5f1c160a5-e79e1a8a1d-rbxuk6';

const options = { method: 'GET', headers: { Accept: 'application/json' } };

// https://www.30secondsofcode.org/js/s/debounce
const debounce = (fn, ms = 0) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const fetchData = async (route = '', params = {}) => {
  try {
    const url = new URL(`${ORIGIN}${route}`);
    url.searchParams.append('api_key', API_KEY);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const endpoint = url.toString();

    const response = await fetch(endpoint, options);
    const data = await response.json();

    return data;
  } catch (e) {
    console.error(e);
  }
};

const ExchangeRow = ({ currency }) => {
  const [rate, setRate] = useState('Loading...');

  useEffect(() => {
    async function fetchExchangeRate(currency) {
      const to = 'UAH';
      try {
        const rate = await fetchData('/fetch-one', {
          from: currency,
          to: to,
        });

        setRate(rate.result[to]);
      } catch (e) {
        return '--';
      }
    }

    fetchExchangeRate(currency);
  }, []);

  return (
    <tr>
      <td>{currency}/UAH</td>
      <td>{typeof rate === 'number' ? rate.toFixed(2) : rate}</td>
    </tr>
  );
};

const ExchangeTable = () => (
  <table className="table">
    <tbody>
      <ExchangeRow currency="USD" />
      <ExchangeRow currency="EUR" />
    </tbody>
  </table>
);

const CurrenciesSelector = ({ options, value, onChange, id, name }) => {
  return (
    <select name={name} id={id} value={value} className="select" onChange={e => onChange(e.target.value)}>
      {options.map(currency => {
        return <option value={currency}>{currency}</option>;
      })}
    </select>
  );
};

function App() {
  const [currencies, setCurrencies] = useState([]);

  const [currencyToSell, setCurrencyToSell] = useState('UAH');
  const [amountToSell, setAmountToSell] = useState();

  const [currencyToBuy, setCurrencyToBuy] = useState('USD');
  const [amountToBuy, setAmountToBuy] = useState();

  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const result = await fetchData('/currencies');
        setCurrencies(Object.keys(result.currencies));
      } catch (e) {
        return '--';
      }
    }

    fetchCurrencies();
  }, []);

  const fetchConvertation = useCallback(
    debounce(async (from, to, amount, onFinish) => {
      try {
        const result = await fetchData('/convert', { from, to, amount });
        onFinish(result.result[to].toFixed(2));
      } catch (e) {
        return '--';
      }
    }, 500),
    [],
  );

  return (
    <div className="container">
      <h1 className="heading">Currency Rate</h1>
      <ExchangeTable />
      <div>
        <div className="controls">
          <CurrenciesSelector
            id="sellCurrency"
            name="Sell Currency"
            value={currencyToSell}
            options={currencies}
            onChange={newCurrencyToSell => {
              setCurrencyToSell(newCurrencyToSell);
              fetchConvertation(newCurrencyToSell, currencyToBuy, amountToSell, setAmountToBuy);
            }}
          />
          <input
            type="number"
            value={amountToSell}
            placeholder="0"
            className="input"
            onChange={e => {
              const newAmountToSell = e.target.value;
              setAmountToSell(newAmountToSell);
              fetchConvertation(currencyToSell, currencyToBuy, newAmountToSell, setAmountToBuy);
            }}
          />
        </div>
        <div className="controls">
          <CurrenciesSelector
            id="buyCurrency"
            name="Buy Currency"
            value={currencyToBuy}
            options={currencies}
            onChange={newCurrencyToBuy => {
              setCurrencyToBuy(newCurrencyToBuy);
              fetchConvertation(currencyToSell, newCurrencyToBuy, amountToBuy, setAmountToBuy);
            }}
          />
          <input
            type="number"
            value={amountToBuy}
            placeholder="0"
            className="input"
            onChange={e => {
              const newAmountToBuy = e.target.value;
              setAmountToBuy(newAmountToBuy);
              fetchConvertation(currencyToBuy, currencyToSell, newAmountToBuy, setAmountToSell);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
