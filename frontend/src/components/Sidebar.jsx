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
  Cpu,
  Compass,
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
          <span>Monitoramento</span>
        </NavLink>

        <NavLink to="/clima-dia" className="menu-item">
          <CloudSun size={20} />
          <span>Clima do Dia</span>
        </NavLink>

        <NavLink to="/locais" className="menu-item">
          <MapPin size={20} />
          <span>Locais Monitorados</span>
        </NavLink>

        <NavLink to="/estacoes" className="menu-item">
          <Cpu size={20} />
          <span>Estações Locais</span>
        </NavLink>

        <NavLink to="/alertas" className="menu-item">
          <AlertTriangle size={20} />
          <span>Alertas</span>
        </NavLink>

        <NavLink to="/rosa-dos-ventos" className="menu-item">
          <Compass size={20} />
          <span>Rosa dos Ventos</span>
        </NavLink>

        <NavLink to="/mapa" className="menu-item">
          <Map size={20} />
          <span>Mapa Meteorológico</span>
        </NavLink>

        <NavLink to="/registros" className="menu-item">
          <CloudSun size={20} />
          <span>Registros</span>
        </NavLink>

        <NavLink to="/analises" className="menu-item">
          <BarChart3 size={20} />
          <span>Análises</span>
        </NavLink>

        <NavLink to="/relatorios" className="menu-item">
          <FileText size={20} />
          <span>Relatórios</span>
        </NavLink>

        <NavLink to="/status" className="menu-item">
          <ShieldCheck size={20} />
          <span>Status do Sistema</span>
        </NavLink>

        <NavLink to="/configuracoes" className="menu-item">
          <Settings size={20} />
          <span>Configurações</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;