import { useState } from "react";
import { CloudSun, Lock, Mail, UserPlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const { entrar, cadastrar } = useAuth();

  const [modoCadastro, setModoCadastro] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviarFormulario(e) {
    e.preventDefault();

    if (!email || !senha) {
      setMensagem("Informe e-mail e senha.");
      return;
    }

    try {
      setCarregando(true);
      setMensagem("");

      if (modoCadastro) {
        await cadastrar(email, senha);
      } else {
        await entrar(email, senha);
      }
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        setMensagem("Este e-mail já está cadastrado.");
      } else if (error.code === "auth/invalid-credential") {
        setMensagem("E-mail ou senha inválidos.");
      } else if (error.code === "auth/weak-password") {
        setMensagem("A senha precisa ter pelo menos 6 caracteres.");
      } else {
        setMensagem("Erro ao autenticar usuário.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-icon">
            <CloudSun size={42} />
          </div>

          <h1>MeteoTrack</h1>
          <p>Monitoramento meteorológico e estações locais inteligentes.</p>
        </div>

        {mensagem && <div className="message-box error-message">{mensagem}</div>}

        <form onSubmit={enviarFormulario} className="auth-form">
          <div className="form-group">
            <label>E-mail</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                placeholder="seuemail@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Senha</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                placeholder="mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
          </div>

          <button type="submit">
            {modoCadastro ? <UserPlus size={18} /> : <Lock size={18} />}
            {carregando
              ? "Aguarde..."
              : modoCadastro
              ? "Criar conta"
              : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => setModoCadastro(!modoCadastro)}
        >
          {modoCadastro
            ? "Já tenho conta, entrar"
            : "Não tenho conta, criar cadastro"}
        </button>
      </div>
    </div>
  );
}

export default Login;