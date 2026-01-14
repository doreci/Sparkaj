import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAdById,
    selectSingleAdData,
    selectSingleAdStatus,
    selectSingleAdError,
} from "../store/singleAdSlice";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import "./adpage.css";

const stripePromise = loadStripe('pk_test_51SebNeCxvTBjwGGPRWn67pHWIRK4qGjk9UJWfPfpF6lHkzSm1pBKvwi5d3YOBjFz9AxAz3kJzDbVZQh3gkUeZHHG00jZxKEkzz');

function AdPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const ad = useSelector(selectSingleAdData);
    const status = useSelector(selectSingleAdStatus);
    const error = useSelector(selectSingleAdError);
    const [selectedOglas, setSelectedOglas] = useState(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            dispatch(fetchAdById(id)).finally(() => setIsLoading(false));
        }
    }, [id, dispatch]);

    if (isLoading || status === "loading") {
        return (
            <div className="ad-page-container">
                <div className="loading">
                    <p>Učitavanje oglasa...</p>
                </div>
            </div>
        );
    }

    if (error || !ad) {
        return (
            <div className="ad-page-container">
                <div className="error-container">
                    <h2>Greška pri učitavanju oglasa</h2>
                    <p>{error || "Oglas nije pronađen"}</p>
                    <button
                        onClick={() => navigate("/")}
                        className="btn-primary"
                    >
                        Nazad na početnu
                    </button>
                </div>
            </div>
        );
    }

    const korisnik = ad.korisnik || {};
    const cijena = ad.cijena ? `${ad.cijena.toFixed(2)} €` : "Nije dostupno";
    const ocjena = ad.prosj_ocjena ? ad.prosj_ocjena.toFixed(1) : "N/A";
    const grad = ad.grad;
    const ulicaBroj = ad.ulica_broj;
    const postanskiBroj = ad.postanski_broj;

    // složena adresa za mapu
    const fullLokacija = [ulicaBroj, postanskiBroj, grad]
        .filter(Boolean)
        .join(", ");

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

    return (
        <div className="ad-page-container">
            <div className="ad-page-header">
                <button onClick={() => navigate(-1)} className="btn-back">
                    ← Nazad
                </button>
            </div>

            <div className="ad-page-content">
                {/* Glavna sekcija sa informacijama */}
                <div className="ad-main-section">
                    {/* Naziv i osnovni podaci */}
                    <div className="ad-header-info">
                        <h1 className="ad-title">{ad.naziv_oglasa}</h1>
                        <div className="ad-meta">
                            <span className="ad-id">ID: {ad.id_oglasa}</span>
                            <span className="ad-rating">
                                ⭐ {ocjena} (
                                {ad.prosj_ocjena
                                    ? "ocijenjeno"
                                    : "nije ocijenjeno"}
                                )
                            </span>
                        </div>
                    </div>

                    {/* Cijena - istaknuta */}
                    <div className="ad-price-section">
                        <div className="price-tag">
                            <span className="price-label">Cijena:</span>
                            <span className="price-value">{cijena}</span>
                        </div>
                    </div>

                    {/* Opis */}
                    <div className="ad-description-section">
                        <h2>Opis oglasa</h2>
                        <div className="ad-description">
                            <p>{ad.opis_oglasa || "Nema dostupnog opisa"}</p>
                        </div>
                    </div>

                    {/* Informacije o prodavaču */}
                    <div className="ad-seller-section">
                        <h2>O prodavaču</h2>
                        <div className="seller-card">
                            {korisnik.profilna && (
                                <div className="seller-avatar">
                                    <img
                                        src={korisnik.profilna}
                                        alt={korisnik.nadimak || "Prodavač"}
                                        className="avatar-image"
                                    />
                                </div>
                            )}

                            <div className="seller-info">
                                <div className="seller-name">
                                    {korisnik.ime && korisnik.prezime ? (
                                        <>
                                            <h3>
                                                {korisnik.ime}{" "}
                                                {korisnik.prezime}
                                            </h3>
                                            <p className="seller-nickname">
                                                @{korisnik.nadimak}
                                            </p>
                                        </>
                                    ) : (
                                        <h3>
                                            {korisnik.nadimak ||
                                                "Nepoznat prodavač"}
                                        </h3>
                                    )}
                                </div>

                                <div className="seller-details">
                                    {korisnik.broj_mobitela && (
                                        <div className="detail-item">
                                            <span className="label">
                                                Kontakt:
                                            </span>
                                            <span className="value">
                                                +387 {korisnik.broj_mobitela}
                                            </span>
                                        </div>
                                    )}
                                    {korisnik.nadimak && (
                                        <div className="detail-item">
                                            <Link
                                                to={`/profile/${korisnik.nadimak}`}
                                                className="profile-link"
                                            >
                                                Pogledaj profil →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dodatne informacije */}
                    <div className="ad-details-section">
                        <h2>Dodatne informacije</h2>
                        <div className="details-grid">
                            <div className="detail-box">
                                <span className="detail-label">ID Oglasa</span>
                                <span className="detail-value">
                                    {ad.id_oglasa}
                                </span>
                            </div>
                            <div className="detail-box">
                                <span className="detail-label">
                                    ID Prodavača
                                </span>
                                <span className="detail-value">
                                    {ad.id_korisnika}
                                </span>
                            </div>
                            <div className="detail-box">
                                <span className="detail-label">
                                    Prosječna ocjena
                                </span>
                                <span className="detail-value">{ocjena}/5</span>
                            </div>
                            <div className="detail-box">
                                <span className="detail-label">Status</span>
                                <span className="detail-value">Dostupno</span>
                            </div>
                        </div>
                    </div>

                    {/* Akcije */}
                    <div className="ad-actions">
                        <button className="pay-button"
                            onClick={() => handlePayment(ad)}>
                            Pay Now
                        </button>   
                        <button className="btn-secondary btn-large">
                            Prijavi oglas
                        </button>
                    </div>
                </div>
            </div>

            {/* Lokacija */}
            {fullLokacija && (
                <div className="ad-location-section">
                    <h2>Lokacija parkinga</h2>

                    <div className="location-address">
                         {fullLokacija}
                    </div>

                    <div className="map-container">
                        <iframe
                            title="Lokacija parkinga"
                            src={`https://www.google.com/maps?q=${encodeURIComponent(fullLokacija)}&output=embed`}
                            width="100%"
                            height="350"
                            style={{ border: 0, borderRadius: "10px" }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {selectedOglas && (
                <div className="payment-modal-overlay">
                    <div className="payment-modal">
                        <h2>Payment for Parking Spot</h2>
                        <div className="payment-details">
                            <p><strong>Spot:</strong> {selectedOglas.naziv_oglasa}</p>
                            <p><strong>Price:</strong> ${selectedOglas.cijena}</p>
                            <p><strong>Location:</strong> {selectedOglas.grad}</p>
                        </div>
                        
                        <Elements stripe={stripePromise}>
                            <PaymentForm 
                                oglas={selectedOglas} 
                                onSuccess={handlePaymentSuccess}
                                onCancel={handleCancelPayment}
                            />
                        </Elements>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="ad-page-footer">
                <p>&copy; 2025 Sparkaj. Sva prava zadržana.</p>
            </div>
        </div>
    );
}

// Payment Form Component
// Payment Form Component
function PaymentForm({ oglas, onSuccess, onCancel }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            setError('Stripe has not loaded yet. Please try again.');
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError('Card element not found. Please refresh and try again.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // For demo purposes, we'll simulate a successful payment
            // In a real app, you'd:
            // 1. Create a payment intent on your backend
            // 2. Use stripe.confirmCardPayment() to process the payment
            
            console.log('Processing payment for:', oglas.naziv_oglasa);
            
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setLoading(false);
            
            // Show success message and close modal
            alert('Payment successful! Your parking spot has been reserved.');
            onSuccess();
            
        } catch (err) {
            setLoading(false);
            setError('Payment failed. Please try again.');
            console.error('Payment error:', err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="payment-form">
            <div className="card-element-container">
                <label>Card Information</label>
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
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
            </div>
            
            {error && <div className="payment-error">{error}</div>}
            
            <div className="payment-buttons">
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="cancel-button"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={!stripe || loading}
                    className="pay-button"
                >
                    {loading ? 'Processing...' : `Pay $${oglas.cijena}`}
                </button>
            </div>
        </form>
    );
}

export default AdPage;
