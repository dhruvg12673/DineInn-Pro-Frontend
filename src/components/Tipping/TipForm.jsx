import React, { useState } from 'react';

const tipPercentages = [15, 18, 20, 25];

const TipForm = ({ billTotal, onSubmit }) => {
  const [tipAmount, setTipAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handlePercentageClick = (percentage) => {
    const amount = billTotal * (percentage / 100);
    setTipAmount(amount);
    setCustomAmount(''); // Clear custom amount
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    setTipAmount(parseFloat(value) || 0);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if(tipAmount > 0) {
        onSubmit({ tipAmount: tipAmount.toFixed(2), total: (billTotal + tipAmount).toFixed(2) });
        setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-teal-600 mb-4">Thank You!</h2>
        <p className="text-gray-700">Your tip of ${tipAmount.toFixed(2)} has been submitted.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <p className="text-lg text-gray-700">Bill Total</p>
        <p className="text-4xl font-bold text-gray-800">${billTotal.toFixed(2)}</p>
      </div>
      <div className="flex justify-center space-x-2 mb-4">
        {tipPercentages.map(p => (
            <button
                key={p}
                onClick={() => handlePercentageClick(p)}
                className="bg-gray-200 hover:bg-teal-200 font-bold py-2 px-4 rounded-full"
            >
                {p}%
            </button>
        ))}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="custom-tip">
          Or Enter Custom Amount
        </label>
        <input
          type="number"
          id="custom-tip"
          value={customAmount}
          onChange={handleCustomAmountChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          placeholder="e.g., 5.00"
        />
      </div>
      <div className="text-center my-6">
        <p className="text-xl font-bold">Total: ${(billTotal + tipAmount).toFixed(2)}</p>
        <p className="text-sm text-gray-600">(Tip: ${tipAmount.toFixed(2)})</p>
      </div>
      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          className="w-full bg-teal-500 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg"
        >
          Submit Tip
        </button>
      </form>
    </div>
  );
};

export default TipForm; 