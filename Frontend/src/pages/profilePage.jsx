import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { selectUserProfile, selectUserStatus } from "../store/userSlice";
import { selectAdsList, selectAdsStatus } from "../store/adSlice";
import AdCard from "../components/adCard";
import "./profilepage.css";
import { isAdmin } from "../utils/authHelpers";

function ProfilePage() {
    const navigate = useNavigate();
    const userProfile = useSelector(selectUserProfile);
    const status = useSelector(selectUserStatus);
    const ads = useSelector(selectAdsList);
    const adsStatus = useSelector(selectAdsStatus);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filtriramo oglase po id_korisnika
    const userAds = ads.filter(ad => ad.id_korisnika === user?.id_korisnika);

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/user", {
                credentials: "include",
            });
            const data = await response.json();
            if (data.authenticated) {
                // Provjeri je li admin i redirekcija na admin page
                if (isAdmin(data)) {
                    console.log("✓ Admin, redirekcija na /admin");
                    navigate("/admin");
                    return;
                }
                
                setUser(data);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.log("Korisnik nije autentificiran");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAdvertiser = async () => {
        try {
            const response = await fetch(
                "http://localhost:8080/api/user/request-advertiser",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Greška pri slanju zahtjeva");
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
        } catch (error) {
            console.error("Greška:", error);
            alert("Greška pri slanju zahtjeva: " + error.message);
        }
    };

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Učitavanje...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-container">
                <div className="not-logged-in">
                    <p>
                        Morate biti ulogirani da biste pristupili vašem profilu
                    </p>
                    <Link to="/login">
                        <button>Idi na login</button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-wrapper">
            <div className="profile-header">
                <Link to="/" className="back-link">
                    ← Nazad
                </Link>
            </div>

            <div className="profile-container">
                <div className="profile-card">
                    {/* Profilna slika */}
                    <div className="profile-image-section">
                        <div className="profile-image-wrapper">
                            {user.picture ? (
                                <img
                                    src={user.picture}
                                    alt="Profilna slika"
                                    className="profile-image"
                                />
                            ) : (
                                <div className="profile-image-placeholder">
                                    {user.given_name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Korisnikove informacije */}
                    <div className="profile-info">
                        <div className="profile-section">
                            <h1 className="profile-name">
                                {user.given_name} {user.family_name}
                            </h1>
                        </div>

                        {/* Osnovne informacije */}
                        <div className="profile-details">
                            <div className="detail-item">
                                <label>Email</label>
                                <p>{user.email || "Nije dostupno"}</p>
                            </div>

                            <div className="detail-item">
                                <label>ID Korisnika</label>
                                <p>{user.id_korisnika || "Nije dostupno"}</p>
                            </div>
                        </div>

                        {/* Akcije */}
                        <div className="profile-actions">
                            <Link to="/editprofile">
                                <button className="btn-edit">
                                    Uredi profil
                                </button>
                            </Link>
                            <Link to="/transaction-history">
                                <button className="btn-transactions">
                                    povijest Transakcija
                                </button>
                            </Link>
                            {user.oglasivac === "NE" && (
                                <button 
                                    className="btn-advertiser"
                                    onClick={handleRequestAdvertiser}
                                    style={{
                                        backgroundColor: "#ff9800",
                                        color: "white",
                                        padding: "10px 20px",
                                        border: "none",
                                        borderRadius: "5px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "600"
                                    }}
                                >
                                    Postani oglasivac
                                </button>
                            )}
                            {user.oglasivac === "ZAHTJEV" && (
                                <div style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#ffd700",
                                    borderRadius: "5px",
                                    fontWeight: "600",
                                    textAlign: "center"
                                }}>
                                    Zahtjev na čekanju
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Korisnikovi oglasi */}
                <div className="user-ads-section">
                    <h2 className="section-title">Moji oglasi</h2>

                    {adsStatus === "loading" && (
                        <div className="loading-message">
                            <p>Učitavanje oglasa...</p>
                        </div>
                    )}

                    {adsStatus !== "loading" && userAds.length === 0 && (
                        <div className="no-ads-message">
                            <p>Nemate postavljenih oglasa</p>
                            <Link to="/napravi-oglas">
                                <button>Napravi novi oglas</button>
                            </Link>
                        </div>
                    )}

                    {adsStatus !== "loading" && userAds.length > 0 && (
                        <div className="ads-grid">
                            {userAds.map(ad => (
                                <AdCard key={ad.id_oglasa} ad={ad} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="footer">
                <p>&copy; 2025 Sparkaj. All rights reserved.</p>
            </div>
        </div>
    );
}

export default ProfilePage;
