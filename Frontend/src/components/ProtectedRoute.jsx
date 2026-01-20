import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const [status, setStatus] = useState("loading"); // loading, allowed, blocked, notAuthenticated
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkUserStatus = async () => {
            try {
                const response = await fetch("http://localhost:8080/api/user", {
                    credentials: "include",
                });
                const data = await response.json();

                if (!data.authenticated) {
                    setStatus("notAuthenticated");
                    return;
                }

                // Ako je korisnik autentificiran, provjeri je li blokiran
                if (data.blokiran) {
                    setStatus("blocked");
                    setUser(data);
                } else {
                    setStatus("allowed");
                    setUser(data);
                }
            } catch (error) {
                console.error("Greška pri provjeri statusa korisnika:", error);
                setStatus("notAuthenticated");
            }
        };

        checkUserStatus();
    }, []);

    if (status === "loading") {
        return <div style={{ padding: "20px", textAlign: "center" }}>Provjera pristupa...</div>;
    }

    if (status === "notAuthenticated") {
        return <Navigate to="/login" replace />;
    }

    if (status === "blocked") {
        return <Navigate to="/blocked" replace />;
    }

    // status === "allowed"
    return children;
}

export default ProtectedRoute;
