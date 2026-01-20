import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAllAds, selectAdsList } from "../store/adSlice";
import { supabase } from "../../supabaseClient";
import { isAdmin } from "../utils/authHelpers";
import "./adminpage.css";

function AdminPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ads = useSelector(selectAdsList);
    const [users, setUsers] = useState([]);
    const [prijave, setPrijave] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/user", {
                credentials: "include",
            });
            const data = await response.json();
            
            if (data.authenticated && isAdmin(data)) {
                console.log("✓ Admin pristup odobren:", data.email);
                setUser(data);
                setIsAuthorized(true);
                dispatch(fetchAllAds());
                fetchUsers();
                fetchPrijave();
            } else {
                console.warn("✗ Korisnik nije admin, redirekcija na home");
                navigate("/");
            }
        } catch (error) {
            console.error("Greška pri provjeri admin pristupa:", error);
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase.from("korisnik").select("*");
            if (error) throw error;
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrijave = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/oglasi/prijave/all", {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Greška pri dohvaćanju prijava");
            const data = await response.json();
            setPrijave(data);
        } catch (error) {
            console.error("Error fetching prijave:", error);
        }
    };

    const deleteAd = async (id) => {
        try {
            const response = await fetch(
                `http://localhost:8080/api/oglasi/${id}`,
                {
                    method: "DELETE",
                }
            );
            if (response.ok) {
                dispatch(fetchAllAds()); // Refresh ads
            } else {
                console.error("Failed to delete ad:", response.statusText);
            }
        } catch (error) {
            console.error("Error deleting ad:", error);
        }
    };

    const deleteUser = async (id) => {
        try {
            const { error } = await supabase
                .from("korisnik")
                .delete()
                .eq("id_korisnika", id);
            if (error) throw error;
            fetchUsers(); // Refresh users
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const markPrijavaAsResolved = async (id) => {
        try {
            const response = await fetch(
                `http://localhost:8080/api/oglasi/prijave/${id}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ status: true }),
                }
            );
            if (response.ok) {
                fetchPrijave(); // Refresh prijave
                alert("Prijava označena kao odrađena");
            } else {
                console.error("Failed to update prijava:", response.statusText);
            }
        } catch (error) {
            console.error("Error updating prijava:", error);
        }
    };

    if (loading) return <div>Provjera pristupa...</div>;

    if (!isAuthorized) {
        return (
            <div className="container">
                <div className="header">
                    <img src="/logo.png" alt="logo" />
                </div>
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <h2>Pristup odbijen</h2>
                    <p>Nemate dozvolu za pristup admin panelu.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <img src="/logo.png" alt="logo" />
            </div>
            <div className="admin-page">
                <h1>Admin Panel</h1>
                <div className="admin-section">
                    <h2>Users</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Ime i Prezime</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id_korisnika}>
                                    <td>{user.id_korisnika}</td>
                                    <td>
                                        {user.ime} {user.prezime}
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <button
                                            onClick={() =>
                                                deleteUser(user.id_korisnika)
                                            }
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="admin-section">
                    <h2>Ads</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ads.map((ad) => (
                                <tr key={ad.id_oglasa}>
                                    <td>{ad.id_oglasa}</td>
                                    <td>{ad.naziv_oglasa}</td>
                                    <td>{ad.cijena}</td>
                                    <td>
                                        <button
                                            onClick={() =>
                                                deleteAd(ad.id_oglasa)
                                            }
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="admin-section">
                    <h2>Prijave Oglasa</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID Prijave</th>
                                <th>ID Korisnika</th>
                                <th>ID Oglasa</th>
                                <th>Opis</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prijave.map((prijava) => (
                                <tr key={prijava.id_prijave}>
                                    <td>{prijava.id_prijave}</td>
                                    <td>{prijava.id_korisnika}</td>
                                    <td>{prijava.id_oglasa}</td>
                                    <td>{prijava.opis}</td>
                                    <td>
                                        <span style={{
                                            padding: "5px 10px",
                                            borderRadius: "5px",
                                            backgroundColor: prijava.status ? "#4caf50" : "#ff9800",
                                            color: "white"
                                        }}>
                                            {prijava.status ? "Odrađena" : "Neodrađena"}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() => navigate(`/ad/${prijava.id_oglasa}`)}
                                                style={{
                                                    backgroundColor: "#2196F3",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "8px 12px",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px"
                                                }}
                                            >
                                                Pogledaj oglas
                                            </button>
                                            {!prijava.status && (
                                                <button
                                                    onClick={() =>
                                                        markPrijavaAsResolved(prijava.id_prijave)
                                                    }
                                                    style={{
                                                        backgroundColor: "#4caf50",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "8px 16px",
                                                        borderRadius: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Označi kao odrađenu
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminPage;
