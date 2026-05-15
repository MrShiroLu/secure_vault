import AuthForm from "../components/AuthForm";

function Register() {
  return (
    <AuthForm
      description="SecureVault hesabınızı oluşturun."
      mode="register"
      submitLabel="Kayıt ol"
      title="Kayıt"
    />
  );
}

export default Register;
