import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Dashboard from "./Dashboard";

const PRIMARY = "#FF8C00";
const DARK = "#0a1628";
const CARD = "#111e35";

export default function App() {
  const [page, setPage] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage("❌ " + error.message);
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password,
      options: { data: { full_name: nom } }
    });
    if (error) setMessage("❌ " + error.message);
    else setMessage("✅ Compte créé ! Vous pouvez vous connecter.");
    setLoading(false);
  };

  if (user) return <Dashboard user={user} onLogout={() => setUser(null)} />;

  return (
    <div style={{
      minHeight: "100vh", background: DARK, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif", padding: "20px"
    }}>
      <div style={{
        background: CARD, borderRadius: "20px", padding: "40px",
        width: "100%", maxWidth: "420px",
        boxShadow: "0 0 60px rgba(255,140,0,0.1)",
        border: "1px solid rgba(255,140,0,0.2)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", fontWeight: "900", color: "white" }}>
            Artisan<span style={{ color: PRIMARY }}>+</span>
          </div>
          <div style={{ color: "#8899aa", fontSize: "14px", marginTop: "4px" }}>
            Gérez votre activité simplement
          </div>
        </div>

        <div style={{ display: "flex", marginBottom: "28px", background: "#0a1628", borderRadius: "10px", padding: "4px" }}>
          {["login", "register"].map(tab => (
            <button key={tab} onClick={() => { setPage(tab); setMessage(""); }} style={{
              flex: 1, padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer",
              background: page === tab ? PRIMARY : "transparent",
              color: page === tab ? "white" : "#8899aa",
              fontWeight: "600", fontSize: "14px", transition: "all 0.2s"
            }}>
              {tab === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {page === "register" && (
            <input placeholder="Nom complet" value={nom}
              onChange={e => setNom(e.target.value)} style={inputStyle} />
          )}
          <input placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input placeholder="Mot de passe" type="password" value={password}
            onChange={e => setPassword(e.target.value)} style={inputStyle} />
          {page === "register" && (
            <input placeholder="Confirmer le mot de passe" type="password" style={inputStyle} />
          )}

          {message && (
            <div style={{ color: message.includes("✅") ? "#4CAF50" : "#ff6b6b",
              fontSize: "13px", textAlign: "center" }}>
              {message}
            </div>
          )}

          <button onClick={page === "login" ? handleLogin : handleRegister}
            disabled={loading} style={{
              background: loading ? "#888" : PRIMARY, color: "white",
              border: "none", borderRadius: "10px", padding: "14px",
              fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
              marginTop: "8px"
            }}>
            {loading ? "Chargement..." : page === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </div>

        {page === "login" && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <span style={{ color: "#8899aa", fontSize: "13px" }}>Pas encore de compte ? </span>
            <span onClick={() => setPage("register")} style={{
              color: PRIMARY, fontSize: "13px", cursor: "pointer", fontWeight: "600"
            }}>
              S'inscrire gratuitement
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)",
  borderRadius: "10px", padding: "13px 16px", color: "white",
  fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box"
};
