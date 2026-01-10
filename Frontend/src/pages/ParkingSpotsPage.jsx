import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './parkingspotspage.css';

const stripePromise = loadStripe('pk_test_51SebNeCxvTBjwGGPRWn67pHWIRK4qGjk9UJWfPfpF6lHkzSm1pBKvwi5d3YOBjFz9AxAz3kJzDbVZQh3gkUeZHHG00jZxKEkzz');

const CheckoutForm = ({ oglas, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    if (!oglas.id_oglasa) {
      setError('Invalid oglas data: missing id_oglasa');
      setProcessing(false);
      return;
    }

    try {
      // Create payment intent
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oglasId: oglas.id_oglasa }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create payment intent' }));
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Test User',
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          onSuccess();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3>Pay for {oglas.naziv_oglasa}</h3>
      <p>Amount: ${oglas.cijena}</p>

      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="button-group">
        <button type="button" onClick={onCancel} className="cancel-button">
          Cancel
        </button>
        <button type="submit" disabled={!stripe || processing} className="pay-button">
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>

      <div className="test-card-info">
        <small>Card: 4242 4242 4242 4242 (any future date, any CVC)</small>
      </div>
    </form>
  );
};

const ParkingSpotsPage = () => {
  const [oglasi, setOglasi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOglas, setSelectedOglas] = useState(null);

  const fetchOglasi = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/oglasi`);
      if (!response.ok) {
        throw new Error('Failed to fetch parking spots');
      }
      const data = await response.json();
      setOglasi(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOglasi();
  }, []);

  const handlePayment = (oglas) => {
    setSelectedOglas(oglas);
  };

  const handlePaymentSuccess = () => {
    alert('Payment successful! Your parking spot has been reserved.');
    setSelectedOglas(null);
  };

  const handleCancelPayment = () => {
    setSelectedOglas(null);
  };

  if (loading) return <div className="loading">Loading parking spots...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <Elements stripe={stripePromise}>
      <div className="parking-spots-page">
        <h1>Available Parking Spots</h1>
        <div className="spots-container">
          {oglasi.map((oglas) => (
            <div key={oglas.id_oglasa} className="spot-card">
              <h2>{oglas.naziv_oglasa}</h2>
              <p>{oglas.opis_oglasa}</p>
              <p className="price">${oglas.cijena}</p>
              {oglas.prosj_ocjena && (
                <p className="rating">Rating: {oglas.prosj_ocjena}/5</p>
              )}
              <button
                className="pay-button"
                onClick={() => handlePayment(oglas)}
              >
                Pay Now
              </button>
            </div>
          ))}
        </div>

        {selectedOglas && (
          <div className="payment-modal">
            <div className="payment-modal-content">
              <CheckoutForm
                oglas={selectedOglas}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancelPayment}
              />
            </div>
          </div>
        )}
      </div>
    </Elements>
  );
};

export default ParkingSpotsPage;