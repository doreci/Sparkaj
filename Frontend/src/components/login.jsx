import { useState } from "react";

function Login() {
    const handleGoogleLogin = () => {
        // Preusmeri na Spring Boot OAuth2 login endpoint
        window.location.href = `${import.meta.env.VITE_API_URL}/oauth2/authorization/google`;
    };

    return(
        <>
            <div className="login-form">
                <button onClick={handleGoogleLogin} className="google-btn">
                    Prijavi se sa Google-om
                </button>
            </div>
        </>
    )
}

export default Login;