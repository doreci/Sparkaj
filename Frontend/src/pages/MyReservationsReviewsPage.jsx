import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./myreservationsreviewspage.css";

function MyReservationsReviewsPage() {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("reservations");
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReservationsAndReviews();

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchReservationsAndReviews();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const fetchReservationsAndReviews = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Dohvati rezervacije
            const reservationsResponse = await fetch(
                `/api/reservations/korisnik`, 
                {
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!reservationsResponse.ok) {
                throw new Error("Greška pri dohvaćanju rezervacija");
            }

            const reservationsData = await reservationsResponse.json();
            
            // Sortiraj rezervacije po id_rezervacije od najvećeg do najmanjeg
            const sortedReservations = (reservationsData || []).sort((a, b) => {
                return b.id_rezervacije - a.id_rezervacije; 
            });
            
            setReservations(sortedReservations);

            const reviewsResponse = await fetch(
                `/api/recenzije/korisnik/current`, 
                {
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (reviewsResponse.ok) {
                const reviewsData = await reviewsResponse.json();
                setReviews(reviewsData || []);
            }
        } catch (err) {
            console.error("Greška:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("hr-HR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStarRating = (rating) => {
        return "★".repeat(rating) + "☆".repeat(5 - rating);
    };

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Učitavanje...</p>
            </div>
        );
    }

    return (
        <div className="myreservationsreviews-page-wrapper">
            <div className="myreservationsreviews-header">
                <Link to="/profile" className="back-link">
                    ← Nazad na profil
                </Link>
                <h1>Moje rezervacije i recenzije</h1>
            </div>

            {error && (
                <div className="error-message">
                    <p>⚠️ {error}</p>
                </div>
            )}

            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === "reservations" ? "active" : ""}`}
                    onClick={() => setActiveTab("reservations")}
                >
                    Rezervacije ({reservations.length})
                </button>
                <button
                    className={`tab-button ${activeTab === "reviews" ? "active" : ""}`}
                    onClick={() => setActiveTab("reviews")}
                >
                    Recenzije ({reviews.length})
                </button>
            </div>

            <div className="myreservationsreviews-content">
                {activeTab === "reservations" && (
                    <div className="reservations-section">
                        <h2>Moje rezervacije</h2>
                        {reservations.length === 0 ? (
                            <div className="empty-state">
                                <p>Nemaš aktivnih rezervacija.</p>
                                <Link to="/">
                                    <button className="btn-browse">
                                        Pretraži oglase
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <div className="reservations-list">
                                {reservations.map((reservation) => (
                                    <div key={reservation.id_rezervacije} className="reservation-card">
                                        <div className="reservation-header">
                                            <h3>Rezervacija #{reservation.id_rezervacije}</h3>
                                            <span className="reservation-id">Oglas: {reservation.id_oglasa}</span>
                                        </div>
                                        <div className="reservation-details">
                                            <div className="detail-row">
                                                <label>Od:</label>
                                                <p>{formatDateTime(reservation.datumOd)}</p>
                                            </div>
                                            <div className="detail-row">
                                                <label>Do:</label>
                                                <p>{formatDateTime(reservation.datumDo)}</p>
                                            </div>
                                        </div>
                                        <div className="reservation-actions">
                                            <Link to={`/ad/${reservation.id_oglasa}`}>
                                                <button className="btn-view-ad">
                                                    Pogledaj oglas
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "reviews" && (
                    <div className="reviews-section">
                        <h2>Moje recenzije</h2>
                        {reviews.length === 0 ? (
                            <div className="empty-state">
                                <p>Nemaš postavljenih recenzija.</p>
                                <p className="hint">Recenzije možeš postavljati nakon što završiš rezervaciju.</p>
                            </div>
                        ) : (
                            <div className="reviews-list">
                                {reviews.map((review) => (
                                    <div key={review.id_recenzije} className="review-card">
                                        <div className="review-header">
                                            <h3>Recenzija #{review.id_recenzije}</h3>
                                            <div className="star-rating">
                                                {getStarRating(review.ocjena)}
                                            </div>
                                        </div>
                                        <div className="review-details">
                                            <div className="detail-row">
                                                <label>Rezervacija:</label>
                                                <p>#{review.id_rezervacije}</p>
                                            </div>
                                            <div className="detail-row">
                                                <label>Ocjena:</label>
                                                <p className="rating">{review.ocjena}/5</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyReservationsReviewsPage;
