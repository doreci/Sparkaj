import "./App.css";
import Login from "./components/login";
import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId =
    "1037227751449-vnk1ihmcvnbje5sq3b6e67u4o1klfqrv.apps.googleusercontent.com";

function App() {
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="background">
                <img src="/background.jpg" alt="" />
            </div>
            <div className="center">
                <div className="logo">
                    <img src="/logo.png" alt="logo.png" />
                </div>
                <div className="login-container">
                    <Login />
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}

export default App;
