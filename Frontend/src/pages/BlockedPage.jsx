import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./blockedpage.css";

function BlockedPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Provjeri je li korisnik blokiran
        const checkBlockStatus = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user`, {
                    credentials: "include",
                });
                const data = await response.json();
                
                if (data.authenticated && !data.blokiran) {
                    navigate("/");
                }
            } catch (error) {
                console.error("Greška pri provjeri statusa:", error);
            }
        };

        checkBlockStatus();
    }, [navigate]);

    const handleLogout = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/logout`;
    };

    return (
        <div className="container blocked-container">
            <div className="header blocked-header">
                <img src="/logo.png" alt="logo" />
            </div>
            <div className="blocked-content">
                <h1>⚠️ Profil je Isključen</h1>
                <p>Vaš profil je privremeno isključen od strane administratora.</p>
                <p>Ako mislite da se radi o grešci, molimo vas kontaktirajte korisničku podršku.</p>
                <button
                    onClick={handleLogout}
                    className="blocked-button"
                >
                    Odjavi se
                </button>
            </div>
        </div>
    );
}

export default BlockedPage;
