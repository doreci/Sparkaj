import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAdById,
    selectSingleAdData,
    selectSingleAdStatus,
    selectSingleAdError,
} from "../store/singleAdSlice";
import { selectUserProfile, fetchUserByUUID } from "../store/userSlice";
import { supabase } from "../../supabaseClient";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import "./adpage.css";

const stripePromise = loadStripe(
    "pk_test_51SebNeCxvTBjwGGPRWn67pHWIRK4qGjk9UJWfPfpF6lHkzSm1pBKvwi5d3YOBjFz9AxAz3kJzDbVZQh3gkUeZHHG00jZxKEkzz"
);

function AdPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const ad = useSelector(selectSingleAdData);
    const status = useSelector(selectSingleAdStatus);
    const error = useSelector(selectSingleAdError);
    const userProfile = useSelector(selectUserProfile);
    const [selectedOglas, setSelectedOglas] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Provjera je li korisnik ulogiran kroz Spring Boot
    useEffect(() => {
        checkAuthentication();
    }, [navigate]);

    const checkAuthentication = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/user", {
                credentials: "include",
            });
            const data = await response.json();
            if (data.authenticated) {
                setUser(data);
            } else {
                navigate("/login");
            }
        } catch (error) {
            console.log("Korisnik nije autentificiran");
            navigate("/login");
        }
    };

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

    const handlePaymentSuccess = (paymentDetails) => {
        setPaymentDetails(paymentDetails);
        setPaymentSuccess(true);
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
                                        alt={"Prodavač"}
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
                                        </>
                                    ) : (
                                        <h3>Nepoznat prodavač</h3>
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
                                    {korisnik.ime && (
                                        <div className="detail-item">
                                            <Link
                                                to={`/profile/${korisnik.ime}`}
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
                        <button
                            className="pay-button"
                            onClick={() => {
                                if (!user) {
                                    alert("Please log in to make a payment");
                                    return;
                                }
                                handlePayment(ad);
                            }}
                        >
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

                    <div className="location-address">{fullLokacija}</div>

                    <div className="map-container">
                        <iframe
                            title="Lokacija parkinga"
                            src={`https://www.google.com/maps?q=${encodeURIComponent(
                                fullLokacija
                            )}&output=embed`}
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
                            <p>
                                <strong>Spot:</strong>{" "}
                                {selectedOglas.naziv_oglasa}
                            </p>
                            <p>
                                <strong>Price:</strong> ${selectedOglas.cijena}
                            </p>
                            <p>
                                <strong>Location:</strong> {selectedOglas.grad}
                            </p>
                        </div>

                        <Elements stripe={stripePromise}>
                            <PaymentForm
                                oglas={selectedOglas}
                                user={user}
                                onSuccess={handlePaymentSuccess}
                                onCancel={handleCancelPayment}
                            />
                        </Elements>
                    </div>
                </div>
            )}

            {/* Payment Success Modal */}
            {paymentSuccess && (
                <PaymentSuccessModal
                    details={paymentDetails}
                    onClose={() => {
                        setPaymentSuccess(false);
                        setPaymentDetails(null);
                    }}
                />
            )}
        </div>
    );
}

{
    /* Footer */
}
<div className="ad-page-footer">
    <p>&copy; 2025 Sparkaj. Sva prava zadržana.</p>
</div>;

// Payment Form Component
// Payment Form Component
function PaymentForm({ oglas, user, onSuccess, onCancel }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!user || !user.id_korisnika) {
            setError("You must be logged in to make a payment.");
            return;
        }

        if (!stripe || !elements) {
            setError("Stripe has not loaded yet. Please try again.");
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError("Card element not found. Please refresh and try again.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Create a payment intent on your backend
            const API_BASE_URL =
                import.meta.env.VITE_API_URL || "http://localhost:8080";
            const response = await fetch(
                `${API_BASE_URL}/api/payments/create-payment-intent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ oglasId: oglas.id_oglasa }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to create payment intent: ${response.statusText}`
                );
            }

            const { clientSecret, paymentIntentId } = await response.json();

            // 2. Use stripe.confirmCardPayment() to process the payment
            const { error: confirmError, paymentIntent } =
                await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: cardElement,
                    },
                });

            if (confirmError) {
                throw new Error(confirmError.message);
            }

            if (paymentIntent.status === "succeeded") {
                console.log("Payment successful:", paymentIntent);

                // 3. Confirm payment with backend and save transaction
                const confirmResponse = await fetch(
                    `${API_BASE_URL}/api/payments/confirm-payment`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            paymentIntentId: paymentIntent.id,
                            oglasId: oglas.id_oglasa,
                            korisnikId: user?.id_korisnika,
                            iznos: paymentIntent.amount / 100,
                        }),
                    }
                );

                if (!confirmResponse.ok) {
                    const errorData = await confirmResponse
                        .json()
                        .catch(() => ({}));
                    console.error("Confirm payment error response:", errorData);
                    throw new Error(
                        `Failed to confirm payment: ${confirmResponse.status} ${
                            confirmResponse.statusText ||
                            JSON.stringify(errorData)
                        }`
                    );
                }

                const confirmData = await confirmResponse.json();
                console.log("Payment confirmed and saved:", confirmData);

                setLoading(false);
                onSuccess({
                    id: paymentIntent.id,
                    amount: paymentIntent.amount / 100,
                    status: paymentIntent.status,
                    created: new Date(
                        paymentIntent.created * 1000
                    ).toLocaleDateString(),
                });
            } else {
                throw new Error("Payment was not successful");
            }
        } catch (err) {
            setLoading(false);
            setError("Payment failed. Please try again.");
            console.error("Payment error:", err);
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
                                fontSize: "16px",
                                color: "#424770",
                                "::placeholder": {
                                    color: "#aab7c4",
                                },
                            },
                            invalid: {
                                color: "#9e2146",
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
                    {loading ? "Processing..." : `Pay $${oglas.cijena}`}
                </button>
            </div>
        </form>
    );
}

// Success Modal Component
function PaymentSuccessModal({ details, onClose }) {
    return (
        <div className="success-modal-overlay">
            <div className="success-modal">
                <div className="success-checkmark">
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h2>Payment Successful!</h2>
                <p className="success-message">
                    Your parking spot has been reserved.
                </p>

                {details && (
                    <div className="success-details">
                        <div className="detail-row">
                            <span className="detail-label">
                                Transaction ID:
                            </span>
                            <span className="detail-value">{details.id}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Amount:</span>
                            <span className="detail-value">
                                €{details.amount.toFixed(2)}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">
                                {details.created}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Status:</span>
                            <span className="detail-value success-status">
                                {details.status}
                            </span>
                        </div>
                    </div>
                )}

                <button onClick={onClose} className="success-button">
                    Continue
                </button>
            </div>
        </div>
    );
}

export default AdPage;