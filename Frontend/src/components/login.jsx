import { useState } from "react";
import { useDispatch } from "react-redux";
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from "../../supabaseClient";
import { fetchUserByUUID } from "../store/userSlice";

function Login() {
    const [session, setSession] = useState(null);
    const dispatch = useDispatch();

    const signUp = async () => {
        const { data } = await supabase.auth.signInWithOAuth({
            provider: "google",
        });
        
        // After sign in, try to fetch user profile
        if (data) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                console.log("Login: Fetching user by UUID:", session.user.id);
                dispatch(fetchUserByUUID(session.user.id));
            }
        }
    };

    return(
        <>
            <button onClick={signUp}>Sign in with Google</button>
        </>
    )
}

export default Login;