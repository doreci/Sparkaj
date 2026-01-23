import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { selectUserProfile, selectUserStatus } from "../store/userSlice";
import { selectAdsList, selectAdsStatus, fetchAllAds } from "../store/adSlice";
import AdCard from "../components/adCard";
import "./profilepage.css";
import { isAdmin } from "../utils/authHelpers";

function ProfilePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams(); // ID korisnika koji se gleda iz URL-a
    const userProfile = useSelector(selectUserProfile);
    const status = useSelector(selectUserStatus);
    const ads = useSelector(selectAdsList);
    const adsStatus = useSelector(selectAdsStatus);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    // Ako je id u URL-u, prikaži oglase tog korisnika, inače prikaži oglase prijavljenog korisnika
    const displayedUserId = id ? parseInt(id) : user?.id_korisnika;
    const userAds = ads.filter(ad => ad.id_korisnika === displayedUserId);

    // Dohvati sve oglase
    useEffect(() => {
        if (adsStatus === "idle") {
            dispatch(fetchAllAds());
        }
    }, [dispatch, adsStatus]);

    useEffect(() => {
        checkAuthentication();
    }, []);

    useEffect(() => {
        // Ako je id u URL-u i razlikuje se od prijavljenog korisnika, učitaj druge korisnikove podatke
        if (id && id !== user?.id_korisnika && user) {
            fetchUserProfile(parseInt(id));
            setIsOwnProfile(false);
        } else if (!id && user?.id_korisnika) {
            // Ako nema ID-a u URL-u, to je vlastiti profil
            setIsOwnProfile(true);
        }
    }, [id, user?.id_korisnika]);

    const fetchUserProfile = async (userId) => {
        try {
            const response = await fetch(`/api/korisnik/${userId}`, {
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                // console.log("Učitani korisnik:", data);
                // console.log("Profilna slika:", data.profilna);
                setUser(data);
                setIsOwnProfile(false);
            }
        } catch (error) {
            console.error("Greška pri učitavanju profila:", error);
        }
    };

    const checkAuthentication = async () => {
        try {
            const response = await fetch(`/api/user`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.authenticated) {
                // Provjeri je li admin i redirekcija na admin page
                if (isAdmin(data)) {
                    // console.log("Admin, redirekcija na /admin");
                    navigate("/admin");
                    return;
                }
                
                setUser(data);
                if (!id) setIsOwnProfile(true);
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
                `/api/user/request-advertiser`, 
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

    const handleDeleteAd = async (adId) => {
        try {
            const response = await fetch(
                `/api/oglasi/${adId}`, 
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = "Greška pri brisanju oglasa";
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            alert("Oglas uspješno obrisan!");
            // Ponovno učitaj sve oglase jer je oglas obrisan
            dispatch(fetchAllAds());
        } catch (error) {
            console.error("Greška pri brisanju oglasa:", error);
            alert("Greška pri brisanju oglasa: " + error.message);
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
                            {user.profilna || user.picture ? (
                                <img
                                    src={user.profilna || user.picture}
                                    alt="Profilna slika"
                                    className="profile-image"
                                    crossOrigin="anonymous"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="profile-image-placeholder">
                                    {(user.ime || user.given_name)?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Korisnikove informacije */}
                    <div className="profile-info">
                        <div className="profile-section">
                            <h1 className="profile-name">
                                {user.ime || user.given_name} {user.prezime || user.family_name}
                            </h1>
                        </div>

                        {/* Osnovne informacije */}
                        <div className="profile-details">
                            <div className="detail-item">
                                <label>Email: </label>
                                <p>{user.email || "Nije dostupno"}</p>
                            </div>

                            <div className="detail-item">
                                <label>Kontakt: </label>
                                <p>{user.broj_mobitela ? "+385 " + user.broj_mobitela : "Nije upisan"}</p>
                            </div>
                        </div>

                        {/* Akcije */}
                        <div className="profile-actions">
                            {isOwnProfile && (
                                <>
                                    <Link to="/editprofile">
                                        <button className="btn-edit">
                                            Uredi profil
                                        </button>
                                    </Link>
                                    <Link to="/transaction-history">
                                        <button className="btn-transactions">
                                            Povijest transakcija
                                        </button>
                                    </Link>
                                    <Link to="/my-reservations-reviews">
                                        <button className="btn-reservations">
                                            Moje rezervacije i recenzije
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
                                </>
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
                                <AdCard 
                                    key={ad.id_oglasa} 
                                    ad={ad} 
                                    isOwned={isOwnProfile}
                                    onDelete={handleDeleteAd}
                                />
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
