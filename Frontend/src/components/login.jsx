import { useState } from "react";

function Login() {
    const handleGoogleLogin = () => {
        // Preusmeri na Spring Boot OAuth2 login endpoint
        window.location.href = "http://localhost:8080/oauth2/authorization/google";
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