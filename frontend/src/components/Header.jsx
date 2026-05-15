import { CloudSun } from "lucide-react";

function Header() {
  return (
    <header className="header">
      <div>
        <h2>MeteoTrack</h2>
        <p>Monitoramento meteorológico, análises e relatórios em tempo real.</p>
      </div>

      <div className="user-box">
        <CloudSun size={18} />
        <span>Admin</span>
      </div>
    </header>
  );
}

export default Header;