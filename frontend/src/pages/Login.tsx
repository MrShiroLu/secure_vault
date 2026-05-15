import AuthForm from "../components/AuthForm";

function Login() {
  return (
    <AuthForm
      description="Kasanıza erişmek için hesabınızla giriş yapın."
      mode="login"
      submitLabel="Giriş yap"
      title="Giriş"
    />
  );
}

export default Login;
