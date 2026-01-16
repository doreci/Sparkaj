import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/editprofile" element={<EditProfilePage />} />
                    <Route path="/ad/:id" element={<AdPage />} />
                    <Route path="/napravi-oglas" element={<CreateAdPage/>} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/transaction-history" element={<TransactionHistoryPage />} />
                </Routes>
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
