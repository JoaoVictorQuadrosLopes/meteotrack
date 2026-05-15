import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import LocaisMonitorados from "./pages/LocaisMonitorados";
import RegistrosMeteorologicos from "./pages/RegistrosMeteorologicos";
import CentroAnalises from "./pages/CentroAnalises";
import Relatorios from "./pages/Relatorios";
import MapaMeteorologico from "./pages/MapaMeteorologico";
import DetalhesLocal from "./pages/DetalhesLocal";
import AlertasMeteorologicos from "./pages/AlertasMeteorologicos";
import Configuracoes from "./pages/Configuracoes";
import StatusSistema from "./pages/StatusSistema";
import EstacoesLocais from "./pages/EstacoesLocais";
import Login from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { usuario, carregandoAuth } = useAuth();

if (carregandoAuth) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <p>Carregando sistema...</p>
      </div>
    </div>
  );
}

if (!usuario) {
  return <Login />;
}
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />

        <main className="main-content">
          <Header />

          <section className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/locais" element={<LocaisMonitorados />} />
              <Route path="/mapa" element={<MapaMeteorologico />} />
              <Route path="/registros" element={<RegistrosMeteorologicos />} />
              <Route path="/analises" element={<CentroAnalises />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/local/:id" element={<DetalhesLocal />} />
              <Route path="/alertas" element={<AlertasMeteorologicos />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/status" element={<StatusSistema />} />
              <Route path="/estacoes" element={<EstacoesLocais />} />
              
            </Routes>
          </section>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;