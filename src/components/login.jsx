
import { GoogleLogin } from "@react-oauth/google";

const clientId = "1037227751449-vnk1ihmcvnbje5sq3b6e67u4o1klfqrv.apps.googleusercontent.com"; 

function Login() {

    const onSuccess = (credentialResponse) => {
        console.log("LOGIN SUCCESS!", credentialResponse);
        console.log("Credential:", credentialResponse.credential);
    }

    const onError = () => {
        console.log("LOGIN FAILED!");
    }

    return(
        <div id="signInButton">
            <GoogleLogin
                onSuccess={onSuccess}
                onError={onError}
                useOneTap
            />
        </div>
    )
}

export default Login;