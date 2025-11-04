import "./homepage.css";
import { Link } from "react-router-dom";

function HomePage() {
    return (
        <div className="container">
            <div className="header">
                <img src="/logo.png" alt="logo" />
                <div className="header-buttons">
                    <Link to="/register">
                        <button>Register</button>
                    </Link>
                    <Link to="/login">
                        <button>Login</button>
                    </Link>
                </div>
            </div>
            <div className="content">
                <h1>Welcome to Sparkaj</h1>
            </div>
            <div className="footer">
                <p>&copy; 2025 Sparkaj. All rights reserved.</p>
            </div>
        </div>
    );
}
export default HomePage;
