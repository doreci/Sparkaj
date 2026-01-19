import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAds, selectAdsList } from "../store/adSlice";
import { supabase } from "../../supabaseClient";
import "./adminpage.css";

function AdminPage() {
    const dispatch = useDispatch();
    const ads = useSelector(selectAdsList);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(fetchAllAds());
        fetchUsers();
    }, [dispatch]);

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

    if (loading) return <div>Loading...</div>;

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
            </div>
        </div>
    );
}

export default AdminPage;
