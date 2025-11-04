import "./loginpage.css";
import Login from "../components/login";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Link } from "react-router-dom";

const clientId =
    "1037227751449-vnk1ihmcvnbje5sq3b6e67u4o1klfqrv.apps.googleusercontent.com";

function LoginPage() {
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="background">
                <div className="overlay"></div>
                <img src="/background.jpg" alt="" />
            </div>
            <div className="center">
                <div className="logo">
                    <Link to="/">
                        <img src="/logo.png" alt="logo.png" />
                    </Link>
                </div>
                <div className="slogan">Brzo i jednostavno rezervirajte parking!</div>
                <div className="login-container">
                    <Login />
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}

export default LoginPage;
