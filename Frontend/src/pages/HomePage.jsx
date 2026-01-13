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
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        location: "",
        priceMin: "",
        priceMax: "",
        dateFrom: "",
        dateTo: "",
    });

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

    // Zatvori filter dropdown kada se klikne izvan njega
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showFilters && e.target.closest(".search-bar") === null) {
                setShowFilters(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [showFilters]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSearchClick = async () => {
        try {
            // Pripremi parametre za slanje backendu
            const searchParams = {
                location: filters.location || null,
                priceMin: filters.priceMin ? parseInt(filters.priceMin) : null,
                priceMax: filters.priceMax ? parseInt(filters.priceMax) : null,
                dateFrom: filters.dateFrom || null,
                dateTo: filters.dateTo || null,
            };

            console.log("Slanje parametara backendu:", searchParams);

            // API poziv - Odkomentiraj kada je backend spreman
            // const response = await fetch('http://localhost:8080/api/oglasi/search', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(searchParams)
            // });
            //
            // if (response.ok) {
            //     const data = await response.json();
            //     console.log("Rezultati pretrage:", data);
            //     // Ovdje trebaj ažurirati Redux store ili state sa rezultatima
            // } else {
            //     console.error("Greška pri pretrazi");
            // }

            setShowFilters(false);
        } catch (error) {
            console.error("Greška pri pretrazi:", error);
        }
    };

    const handleClearFilters = () => {
        setFilters({
            location: "",
            priceMin: "",
            priceMax: "",
            dateFrom: "",
            dateTo: "",
        });
    };

    // Uzmi samo prvih 5 oglasa
    const topFiveAds = ads.slice(0, 5);
    const isLoading = status === "loading";

    return (
        <div className="container">
            <div className="header">
                <img src="/logo.png" alt="logo" />
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search..."
                        onFocus={() => setShowFilters(true)}
                    />
                    <img
                        id="povecalo"
                        src="/search-icon.jpg"
                        alt="search icon"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ cursor: "pointer" }}
                    />

                    {/* Filter Dropdown */}
                    {showFilters && (
                        <div className="filter-dropdown">
                            <div className="filter-header">
                                <h3>Filtri pretrage</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowFilters(false)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="filter-section">
                                <label htmlFor="location">
                                    Grad i lokacija
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={filters.location}
                                    onChange={handleFilterChange}
                                    placeholder="Unesite grad ili lokaciju"
                                />
                            </div>

                            <div className="filter-section">
                                <label>Cijena</label>
                                <div className="price-inputs">
                                    <input
                                        type="number"
                                        name="priceMin"
                                        value={filters.priceMin}
                                        onChange={handleFilterChange}
                                        placeholder="Od"
                                        min="0"
                                    />
                                    <span className="separator">-</span>
                                    <input
                                        type="number"
                                        name="priceMax"
                                        value={filters.priceMax}
                                        onChange={handleFilterChange}
                                        placeholder="Do"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="filter-section">
                                <label>Dostupnost</label>
                                <div className="date-inputs">
                                    <input
                                        type="datetime-local"
                                        name="dateFrom"
                                        value={filters.dateFrom}
                                        onChange={handleFilterChange}
                                    />
                                    <span className="separator">do</span>
                                    <input
                                        type="datetime-local"
                                        name="dateTo"
                                        value={filters.dateTo}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                            </div>

                            <div className="filter-actions">
                                <button
                                    className="filter-btn-search"
                                    onClick={handleSearchClick}
                                >
                                    Pretraži
                                </button>
                                <button
                                    className="filter-btn-clear"
                                    onClick={handleClearFilters}
                                >
                                    Očisti filtere
                                </button>
                            </div>
                        </div>
                    )}
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
