import { supabase } from "../../supabaseClient";
import "./loginpage.css";
import Login from "../components/login";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Auth } from '@supabase/auth-ui-react'
import { useEffect, useState } from "react";

const clientId =
    "1037227751449-vnk1ihmcvnbje5sq3b6e67u4o1klfqrv.apps.googleusercontent.com";

function LoginPage() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <>
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
      </>
    );
  }
  else {
      return (
        <>
          <div>
            <h2>Dobrodošao/la, {session?.user?.user_metadata?.full_name}</h2>
            <button onClick={signOut}>Sign out</button>
          </div>
        </>
    );
  }
}

export default LoginPage;
