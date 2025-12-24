import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const PaymentSuccessful = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-center px-4">
      <CheckCircle size={80} className="text-red-500 mb-4" />
      <h1 className="text-3xl font-bold text-red-700">Payment Successful!</h1>
      <p className="text-gray-300 mt-2">Thank you for your purchase. Your payment has been processed successfully.</p>

      <Link to="/login" className="mt-6 inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
        Go to Login
      </Link>
    </div>
  );
};

export default PaymentSuccessful;
