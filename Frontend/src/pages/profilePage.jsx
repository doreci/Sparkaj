import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
    selectUserProfile,
    selectUserStatus,
    fetchUserByUUID,
} from "../store/userSlice";
import { supabase } from "../../supabaseClient";
import "./profilepage.css";

function ProfilePage() {
    const dispatch = useDispatch();
    const userProfile = useSelector(selectUserProfile);
    const status = useSelector(selectUserStatus);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user?.id) {
                dispatch(fetchUserByUUID(session.user.id));
            }
            setLoading(false);
        });
    }, [dispatch]);

    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading">Učitavanje...</div>
            </div>
        );
    }

    if (!session) {
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

    if (!userProfile) {
        return (
            <div className="profile-container">
                <div className="no-profile">
                    <p>Profil nije dostupan</p>
                    <Link to="/">
                        <button>Nazad na početnu</button>
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
                            {userProfile.slika ? (
                                <img
                                    src={userProfile.slika}
                                    alt="Profilna slika"
                                    className="profile-image"
                                />
                            ) : (
                                <div className="profile-image-placeholder">
                                    {userProfile.nadimak
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
                                {userProfile.ime} {userProfile.prezime}
                            </h1>
                        </div>

                        {/* Osnovne informacije */}
                        <div className="profile-details">
                            <div className="detail-item">
                                <label>Email</label>
                                <p>{userProfile.email || "Nije dostupno"}</p>
                            </div>

                            <div className="detail-item">
                                <label>Broj mobilnog</label>
                                <p>
                                    {userProfile.broj_mobitela
                                        ? userProfile.broj_mobitela
                                        : "Nije dostupno"}
                                </p>
                            </div>

                            <div className="detail-item">
                                <label>ID korisnika</label>
                                <p>{userProfile.id_korisnika}</p>
                            </div>
                        </div>

                        {/* Akcije */}
                        <div className="profile-actions">
                            <Link to="/editprofile">
                                <button className="btn-edit">
                                    Uredi profil
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
