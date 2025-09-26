import { GoogleLogin } from "@react-oauth/google";
import { useGoogleAuthMutation } from "../features/auth/authApi";

export default function GoogleLoginButton() {
  const [googleAuth] = useGoogleAuthMutation();

  const handleGoogleLogin = async (response) => {
    try {
      if (response?.credential) {
        await googleAuth({ token: response.credential }).unwrap();
        // success -> tokens saved via onQueryStarted
      }
    } catch (e) {
      console.error("Google login failed", e);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleLogin}
      onError={() => console.error("Google login failed")}
    />
  );
}
