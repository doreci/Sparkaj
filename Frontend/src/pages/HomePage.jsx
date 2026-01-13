import { supabase } from "../../supabaseClient";
import "./homepage.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAds, selectAdsList, selectAdsStatus } from "../store/adSlice";
import AdCard from "../components/adCard";

function HomePage() {
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

    // Uzmi samo prvih 5 oglasa
    const topFiveAds = ads.slice(0, 5);
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
                    <h2 className="section-title">Popularni oglasi</h2>

                    {isLoading && (
                        <div className="loading-message">
                            <p>Učitavanje oglasa...</p>
                        </div>
                    )}

                    {!isLoading && topFiveAds.length === 0 && (
                        <div className="no-ads-message">
                            <p>Nema dostupnih oglasa</p>
                        </div>
                    )}

                    {!isLoading && topFiveAds.length > 0 && (
                        <div className="ads-grid">
                            {topFiveAds.map((ad) => (
                                <AdCard key={ad.id_oglasa} ad={ad} />
                            ))}
                        </div>
                    )}
{/* 
                    {!isLoading && topFiveAds.length > 0 && (
                        <div className="view-all">
                            <Link to="/oglasi" className="btn-view-all">
                                Pogledaj sve oglase →
                            </Link>
                        </div>
                    )} */}
                </div>
            </div>

            <div className="footer">
                <p>&copy; 2025 Sparkaj. All rights reserved.</p>
            </div>
        </div>
    );
}

export default HomePage;
