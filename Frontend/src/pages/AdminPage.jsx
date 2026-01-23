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
    const [zahtjevi, setZahtjevi] = useState([]);
    const [blokirani, setBlokirani] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const response = await fetch(`/api/user`, {
                credentials: "include",
            });
            const data = await response.json();
            
            if (data.authenticated && isAdmin(data)) {
                // console.log("Admin pristup odobren:", data.email);
                setUser(data);
                setIsAuthorized(true);
                dispatch(fetchAllAds());
                fetchUsers();
                fetchPrijave();
                fetchZahtjevi();
                fetchBlokirani();
            } else {
                // console.warn("Korisnik nije admin, redirekcija na home");
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
            const response = await fetch(`/api/oglasi/prijave/all`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Greška pri dohvaćanju prijava");
            const data = await response.json();
            setPrijave(data);
        } catch (error) {
            console.error("Error fetching prijave:", error);
        }
    };

    const fetchZahtjevi = async () => {
        try {
            const response = await fetch(`/api/admin/pending-advertisers`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Greška pri dohvaćanju zahtjeva");
            const data = await response.json();
            setZahtjevi(data.zahtjevi || []);
        } catch (error) {
            console.error("Error fetching zahtjevi:", error);
        }
    };

    const fetchBlokirani = async () => {
        try {
            const response = await fetch(`/api/admin/blocked-users`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Greška pri dohvaćanju blokiranih korisnika");
            const data = await response.json();
            setBlokirani(data.blokirani || []);
        } catch (error) {
            console.error("Error fetching blokirani:", error);
        }
    };

    const deleteAd = async (id) => {
        try {
            const response = await fetch(
                `/api/oglasi/${id}`,
                {
                    method: "DELETE",
                }
            );
            if (response.ok) {
                dispatch(fetchAllAds());
            } else {
                console.error("Failed to delete ad:", response.statusText);
            }
        } catch (error) {
            console.error("Error deleting ad:", error);
        }
    };

    const deleteUser = async (id) => {
        // Potvrda prije brisanja
        if (!window.confirm("Jeste li sigurni da želite obrisati korisnika? Ova akcija se ne može poništiti.")) {
            return;
        }

        try {
            const { error } = await supabase
                .from("korisnik")
                .delete()
                .eq("id_korisnika", id);
            if (error) throw error;
            fetchUsers(); 
            alert("Korisnik je obrisan");
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Greška pri brisanju korisnika");
        }
    };

    const blockUser = async (id) => {
        try {
            const response = await fetch(
                `/api/admin/block-user/${id}`,
                {
                    method: "PUT",
                    credentials: "include",
                }
            );
            if (response.ok) {
                fetchUsers(); 
                alert("Korisnik je blokiran");
            } else {
                console.error("Failed to block user:", response.statusText);
            }
        } catch (error) {
            console.error("Error blocking user:", error);
        }
    };

    const markPrijavaAsResolved = async (id) => {
        try {
            const response = await fetch(
                `/api/oglasi/prijave/${id}/status`,
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
                fetchPrijave(); 
                alert("Prijava označena kao odrađena");
            } else {
                console.error("Failed to update prijava:", response.statusText);
            }
        } catch (error) {
            console.error("Error updating prijava:", error);
        }
    };

    const approveAdvertiser = async (id) => {
        try {
            const response = await fetch(
                `/api/admin/approve-advertiser/${id}`,
                {
                    method: "PUT",
                    credentials: "include",
                }
            );
            if (response.ok) {
                fetchZahtjevi(); 
                alert("Zahtjev je odobren");
            } else {
                console.error("Failed to approve advertiser:", response.statusText);
            }
        } catch (error) {
            console.error("Error approving advertiser:", error);
        }
    };

    const rejectAdvertiser = async (id) => {
        try {
            const response = await fetch(
                `/api/admin/reject-advertiser/${id}`,
                {
                    method: "PUT",
                    credentials: "include",
                }
            );
            if (response.ok) {
                fetchZahtjevi(); 
                alert("Zahtjev je odbijen");
            } else {
                console.error("Failed to reject advertiser:", response.statusText);
            }
        } catch (error) {
            console.error("Error rejecting advertiser:", error);
        }
    };

    const unblockUser = async (id) => {
        try {
            const response = await fetch(
                `/api/admin/unblock-user/${id}`,
                {
                    method: "PUT",
                    credentials: "include",
                }
            );
            if (response.ok) {
                fetchBlokirani();
                fetchUsers(); 
                alert("Korisnik je odblokirаn");
            } else {
                console.error("Failed to unblock user:", response.statusText);
            }
        } catch (error) {
            console.error("Error unblocking user:", error);
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
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() =>
                                                    blockUser(user.id_korisnika)
                                                }
                                                style={{
                                                    backgroundColor: "#ff9800",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "8px 12px",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px"
                                                }}
                                            >
                                                Blokiraj
                                            </button>
                                            <button
                                                onClick={() =>
                                                    deleteUser(user.id_korisnika)
                                                }
                                                style={{
                                                    backgroundColor: "#f44336",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "8px 12px",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px"
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
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
                    <h2>Zahtjevi za Oglašivanje</h2>
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
                            {zahtjevi.length > 0 ? (
                                zahtjevi.map((korisnik) => (
                                    <tr key={korisnik.id_korisnika}>
                                        <td>{korisnik.id_korisnika}</td>
                                        <td>
                                            {korisnik.ime} {korisnik.prezime}
                                        </td>
                                        <td>{korisnik.email}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button
                                                    onClick={() =>
                                                        approveAdvertiser(korisnik.id_korisnika)
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
                                                    Prihvati
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        rejectAdvertiser(korisnik.id_korisnika)
                                                    }
                                                    style={{
                                                        backgroundColor: "#f44336",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "8px 16px",
                                                        borderRadius: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Odbij
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: "center" }}>
                                        Nema zahtjeva na čekanju
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="admin-section">
                    <h2>Blokirani Korisnici</h2>
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
                            {blokirani.length > 0 ? (
                                blokirani.map((korisnik) => (
                                    <tr key={korisnik.id_korisnika}>
                                        <td>{korisnik.id_korisnika}</td>
                                        <td>
                                            {korisnik.ime} {korisnik.prezime}
                                        </td>
                                        <td>{korisnik.email}</td>
                                        <td>
                                            <button
                                                onClick={() =>
                                                    unblockUser(korisnik.id_korisnika)
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
                                                Odblokiraj
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: "center" }}>
                                        Nema blokiranih korisnika
                                    </td>
                                </tr>
                            )}
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
