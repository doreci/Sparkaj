import "./loginpage.css";
import Login from "../components/login";
import { useEffect, useState } from "react";

function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch(`/api/user`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setUser(data);
      }
    } catch (error) {
      console.log("Korisnik nije autentificiran");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`/logout`, {
        method: "POST",
        credentials: "include",
      });
      setIsAuthenticated(false);
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Greška pri odjavi:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="background">
            <img src="/background.jpg" alt="" />
        </div>
        <div className="center">
            <div className="logo">
                <img src="/logo.png" alt="logo.png" />
            </div>
            <div className="slogan">
                Brzo i jednostavno rezervirajte parkirno mjesto!
            </div>
            <div className="login-container">
                <Login />
            </div>
        </div>
      </>
    );
  }
  else {
      return (
        <>
          <div>
            <h2>Dobrodošao/la, {user?.name}</h2>
            <button onClick={handleLogout}>Odjava</button>
          </div>
        </>
    );
  }
}

export default LoginPage;