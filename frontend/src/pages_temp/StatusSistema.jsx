import { useEffect, useState } from "react";
import {
  Activity,
  RefreshCcw,
  Server,
  Database,
  CloudSun,
  FileText,
  MapPin,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import api from "../services/api";

function StatusSistema() {
  const [status, setStatus] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  async function carregarStatus() {
    try {
      setCarregando(true);
      setMensagem("");

      const response = await api.get("/status");

      setStatus(response.data);
    } catch (error) {
      console.error("Erro ao carregar status:", error);
      setMensagem("Não foi possível carregar o status do sistema.");
    } finally {
      setCarregando(false);
    }
  }

  function formatarData(data) {
    if (!data) return "--";

    return new Date(data).toLocaleString("pt-BR");
  }

  function StatusBadge({ online }) {
    return (
      <span className={online ? "status-badge online" : "status-badge offline"}>
        {online ? (
          <>
            <CheckCircle2 size={16} />
            Online
          </>
        ) : (
          <>
            <XCircle size={16} />
            Offline
          </>
        )}
      </span>
    );
  }

  useEffect(() => {
    carregarStatus();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Status do Sistema</h1>
          <p className="page-description">
            Acompanhe a disponibilidade dos serviços principais do MeteoTrack.
          </p>
        </div>

        <button type="button" onClick={carregarStatus}>
          <RefreshCcw size={18} />
          Atualizar status
        </button>
      </div>

      {mensagem && <div className="message-box error-message">{mensagem}</div>}

      {carregando ? (
        <div className="table-card">
          <p>Verificando serviços do sistema...</p>
        </div>
      ) : status ? (
        <>
          <div className="system-status-hero">
            <div>
              <span className="hero-label">Monitoramento interno</span>
              <h2>
                {status.backend.online &&
                status.firebase.online &&
                status.weatherApi.online
                  ? "Todos os serviços principais estão funcionando"
                  : "Existem serviços com falha ou instabilidade"}
              </h2>
              <p>
                Última verificação realizada em{" "}
                {formatarData(status.verificado_em)}.
              </p>
            </div>

            <div className="hero-icon">
              <Activity size={46} />
            </div>
          </div>

          <div className="status-services-grid">
            <div className="status-service-card">
              <div className="status-service-icon">
                <Server size={28} />
              </div>

              <div className="status-service-content">
                <div className="status-service-top">
                  <h3>{status.backend.nome}</h3>
                  <StatusBadge online={status.backend.online} />
                </div>

                <p>{status.backend.mensagem}</p>
              </div>
            </div>

            <div className="status-service-card">
              <div className="status-service-icon">
                <Database size={28} />
              </div>

              <div className="status-service-content">
                <div className="status-service-top">
                  <h3>{status.firebase.nome}</h3>
                  <StatusBadge online={status.firebase.online} />
                </div>

                <p>{status.firebase.mensagem}</p>
              </div>
            </div>

            <div className="status-service-card">
              <div className="status-service-icon">
                <CloudSun size={28} />
              </div>

              <div className="status-service-content">
                <div className="status-service-top">
                  <h3>{status.weatherApi.nome}</h3>
                  <StatusBadge online={status.weatherApi.online} />
                </div>

                <p>{status.weatherApi.mensagem}</p>
              </div>
            </div>
          </div>

          <div className="cards-grid">
            <div className="card">
              <span>Locais cadastrados</span>
              <strong>{status.dados.locais}</strong>
            </div>

            <div className="card">
              <span>Registros salvos</span>
              <strong>{status.dados.registros}</strong>
            </div>

            <div className="card">
              <span>Relatórios gerados</span>
              <strong>{status.dados.relatorios}</strong>
            </div>

            <div className="card">
              <span>Serviços online</span>
              <strong>
                {
                  [
                    status.backend.online,
                    status.firebase.online,
                    status.weatherApi.online
                  ].filter(Boolean).length
                }
                /3
              </strong>
            </div>
          </div>

          <div className="system-info-grid">
            <div className="system-info-card">
              <div>
                <MapPin size={24} />
                <h3>Locais monitorados</h3>
              </div>
              <p>
                Quantidade total de locais cadastrados para acompanhamento
                meteorológico.
              </p>
              <strong>{status.dados.locais}</strong>
            </div>

            <div className="system-info-card">
              <div>
                <BarChart3 size={24} />
                <h3>Base histórica</h3>
              </div>
              <p>
                Total de registros meteorológicos coletados manualmente ou de
                forma automática.
              </p>
              <strong>{status.dados.registros}</strong>
            </div>

            <div className="system-info-card">
              <div>
                <FileText size={24} />
                <h3>Relatórios</h3>
              </div>
              <p>
                Total de relatórios salvos no histórico do sistema.
              </p>
              <strong>{status.dados.relatorios}</strong>
            </div>

            <div className="system-info-card">
              <div>
                <Clock size={24} />
                <h3>Última verificação</h3>
              </div>
              <p>
                Momento em que o sistema verificou os serviços principais.
              </p>
              <strong className="date-text">
                {formatarData(status.verificado_em)}
              </strong>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <XCircle size={42} />
          <h3>Status indisponível</h3>
          <p>Não foi possível carregar as informações do sistema.</p>
        </div>
      )}
    </div>
  );
}

export default StatusSistema;