import { supabase } from "../../supabaseClient";
import "./homepage.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function HomePage() {
	
	const [session, setSession] = useState(null);
	
	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
		  setSession(session);
		})
    }, []);
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
    };
    
    //console.log(session);
    
    return (
        <div className="container">
            <div className="header">
                <img src="/logo.png" alt="logo" />
                <div className="search-bar">
                    <input type="text" placeholder="Search..." />
                    <img id="povecalo" src="/search-icon.jpg" alt="search icon" />
                </div>
                <div className="header-buttons">
                	{ session != null &&
                    <Link to='/editprofile'>
                        <button>Edit Profile</button>
                    </Link>
                    }
                    { session == null &&
                    <Link to="/register">
                        <button>Register</button>
                    </Link>
                    }
                    { session != null &&
                    <button onClick={handleLogout}>Logout</button>
                    }
                    { session == null &&
                    <Link to="/login">
                        <button>Login</button>
                    </Link>
                    }
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
