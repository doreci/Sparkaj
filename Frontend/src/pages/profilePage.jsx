import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
    selectUserProfile,
    selectUserStatus,
} from "../store/userSlice";
import "./profilepage.css";

function ProfilePage() {
    const dispatch = useDispatch();
    const userProfile = useSelector(selectUserProfile);
    const status = useSelector(selectUserStatus);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading">Učitavanje...</div>
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
                                    {user.given_name
                                        ?.charAt(0)
                                        .toUpperCase() || "U"}
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
                                <label>Google ID</label>
                                <p>{user.id || "Nije dostupno"}</p>
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
                                    Povijest Transakcija
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer">
                <p>&copy; 2025 Sparkaj. All rights reserved.</p>
            </div>
        </div>
    );
}

export default ProfilePage;
