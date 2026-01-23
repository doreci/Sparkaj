import { supabase } from "../../supabaseClient";
import "./homepage.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isAdmin, getProfileRoute } from "../utils/authHelpers";
import {
    fetchAllAds,
    selectAdsList,
    selectAdsStatus,
    searchAds,
    selectFilteredAdsList,
    selectIsFiltered,
    clearFilters,
} from "../store/adSlice";
import {
    selectUserProfile,
    fetchUserByUUID,
    clearUser,
} from "../store/userSlice";
import AdCard from "../components/adCard";

function HomePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ads = useSelector(selectAdsList);
    const filteredAds = useSelector(selectFilteredAdsList);
    const isFiltered = useSelector(selectIsFiltered);
    const status = useSelector(selectAdsStatus);
    const userProfile = useSelector(selectUserProfile);

    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showAllAds, setShowAllAds] = useState(false);
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
        checkAuthentication();
    }, []);

    useEffect(() => {
        if (userProfile === null) {
            setUser(null);
        }
    }, [userProfile]);

    const checkAuthentication = async () => {
        try {
            const response = await fetch(`/api/user`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.authenticated) {
                setUser(data);
                setSession({ user: data });
            }
        } catch (error) {
            console.log("Korisnik nije autentificiran");
        }
    };

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
        try {
            setUser(null);
            dispatch(clearUser());

            // Preusmjeri na logout endpoint na backendu
            window.location.href = `/logout`; 
        } catch (error) {
            console.error("Greška pri odjavi:", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value, type } = e.target;
        let newValue = value;
        if (type === "datetime-local" && value) {
            // Fiksira minute na :00 - zamjenjuje zadnje :XX sa :00
            newValue = value.replace(/:\d{2}$/, ":00");
            newValue = newValue + ":00";
        }
        setFilters((prev) => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const handleSearchClick = async () => {
        try {
            const searchParams = {
                location: filters.location
                    ? filters.location.replace(/\s+/g, "*")
                    : null,
                priceMin: filters.priceMin
                    ? parseFloat(filters.priceMin)
                    : null,
                priceMax: filters.priceMax
                    ? parseFloat(filters.priceMax)
                    : null,
                dateFrom: filters.dateFrom || null,
                dateTo: filters.dateTo || null,
            };

            console.log("Slanje parametara backendu:", searchParams);

            // Koristi Redux action umjesto direktnog fetch-a
            dispatch(searchAds(searchParams));
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

    // Sortiraj oglase po recenziji silazno
    const sortedAds = [...ads].sort(
        (a, b) => (b.prosj_ocjena || 0) - (a.prosj_ocjena || 0)
    );
    const sortedFilteredAds = [...filteredAds].sort(
        (a, b) => (b.prosj_ocjena || 0) - (a.prosj_ocjena || 0)
    );

    // Uzmi filtrirane oglase ako su dostupni, inače sve oglase
    const displayAds = isFiltered
        ? showAllAds
            ? sortedFilteredAds
            : sortedFilteredAds.slice(0, 5)
        : showAllAds
          ? sortedAds
          : sortedAds.slice(0, 5);
    const isLoading = status === "loading";

    return (
        <div className="container">
            <div className="header">
                <div className="header-logo">
                    <img name="logo" src="/logo.png" alt="logo" />
                </div>
                <div className="search-bar">
                    {user != null && (
                        <button
                            id="btn-filter"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            Filtriraj...
                            <img
                                id="filter"
                                src="/filter-icon.png"
                                alt="filter icon"
                            />
                        </button>
                    )}
                    {showFilters && user != null && (
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
                                        id="fromDate"
                                        type="datetime-local"
                                        name="dateFrom"
                                        value={filters.dateFrom}
                                        onChange={handleFilterChange}
                                    />
                                    <span className="separator">do</span>
                                    <input 
                                        id="toDate"
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
                    {user != null && user.oglasivac === "DA" && (
                        <Link to="/napravi-oglas">
                            <button>Napravi oglas</button>
                        </Link>
                    )}
                    {/* {user != null && (
                        <Link to="/editprofile">
                            <button>Edit Profile</button>
                        </Link>
                    )} */}
                    {user != null && (
                        <button onClick={handleLogout}>Logout</button>
                    )}
                    {user == null && (
                        <Link to="/login">
                            <button>Login</button>
                        </Link>
                    )}
                    {user != null && (
                        <Link to={getProfileRoute(user)} className="profile-icon-link">
                            <div className="profile-icon">
                                {user.picture ? (
                                    <img src={user.picture} alt="Profile" 
                                        crossOrigin="anonymous"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="profile-icon-placeholder">
                                        {user.given_name
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}
                                    </div>
                                )}
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            <div className="content">
                <div className="ads-section">
                    <h2 className="section-title">
                        {isFiltered ? "Rezultati pretrage" : "Popularni oglasi"}
                    </h2>

                    {isLoading && (
                        <div className="loading-message">
                            <p>Učitavanje oglasa</p>
                        </div>
                    )}

                    {!isLoading && displayAds.length === 0 && (
                        <div className="no-ads-message">
                            <p>
                                {isFiltered
                                    ? "Nema oglasa koji odgovaraju vašim kriterijima"
                                    : "Nema dostupnih oglasa"}
                            </p>
                        </div>
                    )}

                    {!isLoading && displayAds.length > 0 && (
                        <div className="ads-grid">
                            {displayAds.map((ad, index) => (
                                <AdCard key={ad.id_oglasa || index} ad={ad} />
                            ))}
                        </div>
                    )}
                    {!isLoading &&
                        (isFiltered
                            ? filteredAds.length > 5
                            : ads.length > 5) && (
                            <div className="view-all">
                                <button
                                    className="btn-view-all"
                                    onClick={() => setShowAllAds(!showAllAds)}
                                >
                                    {showAllAds
                                        ? "Sakrij sve oglase ↑"
                                        : "Pogledaj sve oglase →"}
                                </button>
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

export default HomePage;
