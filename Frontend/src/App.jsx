import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { setUser } from "./store/userSlice";
import { selectUserProfile } from "./store/userSlice";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";
import AdPage from "./pages/adPage.jsx";
import CreateAdPage from "./pages/CreateAdPage.jsx"
import EditAdPage from "./pages/EditAdPage.jsx"
import AdminPage from "./pages/AdminPage.jsx"
import ProfilePage from "./pages/profilePage.jsx"
import TransactionHistoryPage from "./pages/TransactionHistoryPage.jsx"
import BlockedPage from "./pages/BlockedPage.jsx"
import MyReservationsReviewsPage from "./pages/MyReservationsReviewsPage.jsx"
import NotFoundPage from "./pages/NotFoundPage.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"

function App() {
    const dispatch = useDispatch();
    const userProfile = useSelector(selectUserProfile);

    // Provjeri autentifikaciju pri učitavanju aplikacije
    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user`, {
                    credentials: "include",
                });
                const data = await response.json();
                
                if (data.authenticated) {
                    dispatch(setUser(data));
                }
            } catch (error) {
                console.error("Greška pri provjeri autentifikacije:", error);
            }
        };

        checkAuthentication();
    }, [dispatch]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/blocked" element={<BlockedPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/ad/:id" element={<AdPage />} />
                <Route path="/ad/:id" element={<ProtectedRoute><AdPage /></ProtectedRoute>} />
                <Route path="/napravi-oglas" element={<ProtectedRoute><CreateAdPage/></ProtectedRoute>} />
                <Route path="/edit-ad/:id" element={<ProtectedRoute><EditAdPage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="/editprofile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
                <Route path="/transaction-history" element={<ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>} />
                <Route path="/my-reservations-reviews" element={<ProtectedRoute><MyReservationsReviewsPage /></ProtectedRoute>} />
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
