import { useNavigate } from "react-router-dom";
import "./notfoundpage.css";

function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="not-found-header">
                    <h1 className="error-code">404</h1>
                    <h2 className="error-title">Stranica nije pronađena</h2>
                </div>

                <p className="error-description">
                    Stranica ne postoji ili je izbrisana
                </p>

                <div className="error-icon">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="60" cy="60" r="55" stroke="#FF6B6B" strokeWidth="2" />
                        <path d="M60 30V60M60 75V90" stroke="#FF6B6B" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="60" cy="75" r="3" fill="#FF6B6B" />
                    </svg>
                </div>

                <div className="error-actions">
                    <button 
                        className="btn-home" 
                        onClick={() => navigate("/")}
                    >
                        Početna
                    </button>
                    <button 
                        className="btn-back" 
                        onClick={() => navigate(-1)}
                    >
                        Nazad
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotFoundPage;
