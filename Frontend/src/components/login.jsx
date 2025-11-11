import { useState } from "react";
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from "../../supabaseClient";


function Login() {
    const [session, setSession] = useState(null);

    const signUp = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
        });
    };

    return(
        <>
            <button onClick={signUp}>Sign in with Google</button>
        </>
    )
}

export default Login;