import { supabase } from "../../supabaseClient";
import "./homepage.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAds, selectAdsList, selectAdsStatus } from "../store/adSlice";
import AdCard from "../components/adCard";

function AllAdsPage() {
    const dispatch = useDispatch();
    const ads = useSelector(selectAdsList);
    const status = useSelector(selectAdsStatus);

    const [session, setSession] = useState(null);

    // Dohvati sve oglase
    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchAllAds());
        }
    }, [dispatch, status]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
    };

    const isLoading = status === "loading";

    return (
        <div className="container">
            <div className="header">
                <img src="/logo.png" alt="logo" />
                <div className="search-bar">
                    <input type="text" placeholder="Search..." />
                    <img
                        id="povecalo"
                        src="/search-icon.jpg"
                        alt="search icon"
                    />
                </div>
                <div className="header-buttons">
                    {session != null && (
                        <Link to="/napravi-oglas">
                            <button>Napravi oglas</button>
                        </Link>
                    )}
                    {session != null && (
                        <Link to="/editprofile">
                            <button>Edit Profile</button>
                        </Link>
                    )}
                    {session == null && (
                        <Link to="/register">
                            <button>Register</button>
                        </Link>
                    )}
                    {session != null && (
                        <button onClick={handleLogout}>Logout</button>
                    )}
                    {session == null && (
                        <Link to="/login">
                            <button>Login</button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="content">
                {/* Oglasi Grid */}
                <div className="ads-section">
                    <h2 className="section-title">Svi oglasi</h2>

                    {isLoading && (
                        <div className="loading-message">
                            <p>Učitavanje oglasa...</p>
                        </div>
                    )}

                    {!isLoading && ads.length === 0 && (
                        <div className="no-ads-message">
                            <p>Nema dostupnih oglasa</p>
                        </div>
                    )}

                    {!isLoading && ads.length > 0 && (
                        <div className="ads-grid">
                            {ads.map((ad, index) => (
                                <AdCard key={ad.id_oglasa || index} ad={ad} />
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

export default AllAdsPage;