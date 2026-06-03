import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  CloudSun,
  BarChart3,
  FileText,
  Activity,
  Map,
  AlertTriangle,
  Settings,
  ShieldCheck,
  Cpu
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">
          <Activity size={26} />
        </div>

        <div>
          <h1>MeteoTrack</h1>
          <span>Inteligência climática</span>
        </div>
      </div>

      <nav className="menu">
        <NavLink to="/" className="menu-item">
          <LayoutDashboard size={20} />
          Monitoramento
        </NavLink>

        <NavLink to="/alertas" className="menu-item">
          <AlertTriangle size={20} />
          Alertas
        </NavLink>

        <NavLink to="/locais" className="menu-item">
          <MapPin size={20} />
          Locais Monitorados
        </NavLink>
        
        <NavLink to="/estacoes" className="menu-item">
        <Cpu size={20} />
          Estações Locais
        </NavLink>

        <NavLink to="/alertas" className="menu-item">
        <AlertTriangle size={20} />
          Alertas
        </NavLink>

        <NavLink to="/mapa" className="menu-item">
          <Map size={20} />
          Mapa Meteorológico
        </NavLink>

        <NavLink to="/registros" className="menu-item">
          <CloudSun size={20} />
          Registros
        </NavLink>

        <NavLink to="/analises" className="menu-item">
          <BarChart3 size={20} />
          Análises
        </NavLink>

        <NavLink to="/relatorios" className="menu-item">
          <FileText size={20} />
          Relatórios
        </NavLink>

        <NavLink to="/status" className="menu-item">
          <ShieldCheck size={20} />
          Status do Sistema
        </NavLink>

        <NavLink to="/configuracoes" className="menu-item">
          <Settings size={20} />
          Configurações
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;