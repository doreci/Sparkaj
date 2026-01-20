import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./store/store";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";
import AdPage from "./pages/adPage.jsx";
import CreateAdPage from "./pages/CreateAdPage.jsx"
import AdminPage from "./pages/AdminPage.jsx"
import ProfilePage from "./pages/profilePage.jsx"
import TransactionHistoryPage from "./pages/TransactionHistoryPage.jsx"
import BlockedPage from "./pages/BlockedPage.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/blocked" element={<BlockedPage />} />
                    <Route path="/" element={<HomePage />} />
                    <Route path="/ad/:id" element={<AdPage />} />
                    <Route path="/ad/:id" element={<ProtectedRoute><AdPage /></ProtectedRoute>} />
                    <Route path="/napravi-oglas" element={<ProtectedRoute><CreateAdPage/></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<ProfilePage />} />
                    <Route path="/editprofile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
                    <Route path="/transaction-history" element={<ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>} />
                </Routes>
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
