import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./transactionhistorypage.css";

function TransactionHistoryPage() {
    const [transactions, setTransactions] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.authenticated) {
                setUser(data);
                fetchTransactionHistory();
            } else {
                setError("Morate biti ulogirani da biste vidjeli vašu povijest transakcija");
                setLoading(false);
            }
        } catch (error) {
            console.error("Greška pri provjeri autentifikacije:", error);
            setError("Greška pri provjeri autentifikacije");
            setLoading(false);
        }
    };

    const fetchTransactionHistory = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/payments/transaction-history`,
                {
                    credentials: "include",
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // console.log("Transaction history response:", data);
            
            if (data.transactions && Array.isArray(data.transactions)) {
                setTransactions(data.transactions);
                if (data.error) {
                    setError(null);
                }
            } else {
                setTransactions([]);
            }
            
            if (data.error && data.transactions?.length === 0) {
                setError(data.error);
            }
        } catch (error) {
            console.error("Greška pri dohvaćanju povijesti transakcija:", error);
            setError("Greška pri dohvaćanju povijesti transakcija. Pokušajte ponovno.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("hr-HR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("hr-HR", {
            style: "currency",
            currency: "EUR",
        }).format(amount || 0);
    };

    const handleLogout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
                method: "POST",
                credentials: "include",
            });
            navigate("/login");
        } catch (error) {
            console.error("Greška pri odjavi:", error);
        }
    };

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Učitavanje...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="transaction-history-container">
                <div className="not-logged-in-card">
                    <h2>Pristup odbijen</h2>
                    <p>{error || "Morate biti ulogirani"}</p>
                    <Link to="/login">
                        <button className="btn-primary">Idi na login</button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="transaction-history-wrapper">
            <div className="transaction-history-header">
                <Link to="/" className="back-link">
                    ← Nazad na početnu
                </Link>
                <h1>📊 Moja povijest transakcija</h1>
            </div>

            <div className="transaction-history-container">
                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {transactions.length === 0 ? (
                    <div className="no-transactions-card">
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <h2>Nema transakcija</h2>
                            <p>Još nemate izvršenih rezervacija ili plaćanja</p>
                            <Link to="/">
                                <button className="btn-primary">Počni s rezerviranjem</button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="transactions-stats">
                            <div className="stat-card">
                                <span className="stat-label">Ukupno transakcija</span>
                                <span className="stat-value">{transactions.length}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Ukupni iznos</span>
                                <span className="stat-value">
                                    {formatCurrency(
                                        transactions.reduce((sum, t) => sum + (t.iznos || 0), 0)
                                    )}
                                </span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Plaćeno</span>
                                <span className="stat-value">
                                    {transactions.filter((t) => t.placeno).length}
                                </span>
                            </div>
                        </div>

                        <div className="transactions-table-wrapper">
                            <table className="transactions-table">
                                <thead>
                                    <tr>
                                        <th>ID Transakcije</th>
                                        <th>ID Rezervacije</th>
                                        <th>Iznos</th>
                                        <th>Datum</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((transaction, index) => (
                                        <tr
                                            key={transaction.id_transakcija || index}
                                            className="transaction-row"
                                        >
                                            <td>
                                                <code className="transaction-id">
                                                    {transaction.id_transakcija?.substring(
                                                        0,
                                                        12
                                                    )}
                                                    ...
                                                </code>
                                            </td>
                                            <td>{transaction.id_rezervacije}</td>
                                            <td>
                                                <span className="amount-cell">
                                                    {formatCurrency(transaction.iznos)}
                                                </span>
                                            </td>
                                            <td>{formatDate(transaction.datum_transakcije)}</td>
                                            <td>
                                                <span
                                                    className={`status-badge ${
                                                        transaction.placeno ? "paid" : "pending"
                                                    }`}
                                                >
                                                    {transaction.placeno ? (
                                                        <>
                                                            <span className="badge-icon">✓</span>
                                                            Plaćeno
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="badge-icon">⏳</span>
                                                            U tijeku
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}

export default TransactionHistoryPage;
