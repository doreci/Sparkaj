import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./store/store";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";
import AdPage from "./pages/adPage.jsx";
import CreateAdPage from "./pages/CreateAdPage.jsx"

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/editprofile" element={<EditProfilePage />} />
                    <Route path="/ad/:id" element={<AdPage />} />
                    <Route path="/napravi-oglas" element={<CreateAdPage/>} />
                </Routes>
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
