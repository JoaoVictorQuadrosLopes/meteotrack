import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Clock,
  Building2
} from "lucide-react";

const configuracoesPadrao = {
  nomeOrganizacao: "MeteoTrack",
  unidadeTemperatura: "celsius",
  intervaloColeta: "60",
  alertaTemperaturaAlta: "35",
  alertaUmidadeBaixa: "30",
  alertaVentoForte: "50",
  alertaChuvaIntensa: "20",
  modoSistema: "monitoramento"
};

function Configuracoes() {
  const [config, setConfig] = useState(configuracoesPadrao);
  const [mensagem, setMensagem] = useState("");

  function carregarConfiguracoes() {
    const salvas = localStorage.getItem("meteotrack_configuracoes");

    if (salvas) {
      setConfig(JSON.parse(salvas));
    }
  }

  function salvarConfiguracoes(e) {
    e.preventDefault();

    localStorage.setItem("meteotrack_configuracoes", JSON.stringify(config));

    setMensagem("Configurações salvas com sucesso.");
  }

  function restaurarPadrao() {
    const confirmar = confirm("Deseja restaurar as configurações padrão?");

    if (!confirmar) return;

    setConfig(configuracoesPadrao);
    localStorage.setItem(
      "meteotrack_configuracoes",
      JSON.stringify(configuracoesPadrao)
    );

    setMensagem("Configurações padrão restauradas.");
  }

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Configurações</h1>
          <p className="page-description">
            Ajuste os parâmetros gerais do sistema, limites de alerta e coleta
            automática.
          </p>
        </div>
      </div>

      {mensagem && <div className="message-box">{mensagem}</div>}

      <div className="settings-hero">
        <div>
          <span className="hero-label">Administração do sistema</span>
          <h2>Personalize o comportamento do MeteoTrack</h2>
          <p>
            Defina limites de alerta, intervalo de coleta e preferências de
            exibição para tornar o sistema mais adequado ao seu projeto.
          </p>
        </div>

        <div className="hero-icon">
          <Settings size={46} />
        </div>
      </div>

      <form className="settings-form" onSubmit={salvarConfiguracoes}>
        <div className="settings-section">
          <div className="settings-section-header">
            <Building2 size={24} />
            <div>
              <h3>Informações gerais</h3>
              <p>Configurações básicas de identificação e uso do sistema.</p>
            </div>
          </div>

          <div className="settings-grid">
            <div className="form-group">
              <label>Nome da organização/sistema</label>
              <input
                type="text"
                value={config.nomeOrganizacao}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    nomeOrganizacao: e.target.value
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Modo do sistema</label>
              <select
                value={config.modoSistema}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    modoSistema: e.target.value
                  })
                }
              >
                <option value="monitoramento">Monitoramento</option>
                <option value="analise">Análise meteorológica</option>
                <option value="relatorios">Relatórios e histórico</option>
              </select>
            </div>

            <div className="form-group">
              <label>Unidade de temperatura</label>
              <select
                value={config.unidadeTemperatura}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    unidadeTemperatura: e.target.value
                  })
                }
              >
                <option value="celsius">Celsius °C</option>
                <option value="fahrenheit">Fahrenheit °F</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <Clock size={24} />
            <div>
              <h3>Coleta automática</h3>
              <p>Defina de quanto em quanto tempo os dados serão coletados.</p>
            </div>
          </div>

          <div className="settings-grid">
            <div className="form-group">
              <label>Intervalo de coleta automática</label>
              <select
                value={config.intervaloColeta}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    intervaloColeta: e.target.value
                  })
                }
              >
                <option value="15">A cada 15 minutos</option>
                <option value="30">A cada 30 minutos</option>
                <option value="60">A cada 1 hora</option>
                <option value="180">A cada 3 horas</option>
                <option value="360">A cada 6 horas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <Thermometer size={24} />
            <div>
              <h3>Limites de alerta meteorológico</h3>
              <p>
                Defina os valores usados para classificar situações de atenção
                ou risco.
              </p>
            </div>
          </div>

          <div className="settings-grid">
            <div className="form-group">
              <label>Temperatura alta</label>
              <div className="input-with-icon">
                <Thermometer size={18} />
                <input
                  type="number"
                  value={config.alertaTemperaturaAlta}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      alertaTemperaturaAlta: e.target.value
                    })
                  }
                />
                <span>°C</span>
              </div>
            </div>

            <div className="form-group">
              <label>Umidade baixa</label>
              <div className="input-with-icon">
                <Droplets size={18} />
                <input
                  type="number"
                  value={config.alertaUmidadeBaixa}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      alertaUmidadeBaixa: e.target.value
                    })
                  }
                />
                <span>%</span>
              </div>
            </div>

            <div className="form-group">
              <label>Vento forte</label>
              <div className="input-with-icon">
                <Wind size={18} />
                <input
                  type="number"
                  value={config.alertaVentoForte}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      alertaVentoForte: e.target.value
                    })
                  }
                />
                <span>km/h</span>
              </div>
            </div>

            <div className="form-group">
              <label>Chuva intensa</label>
              <div className="input-with-icon">
                <CloudRain size={18} />
                <input
                  type="number"
                  value={config.alertaChuvaIntensa}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      alertaChuvaIntensa: e.target.value
                    })
                  }
                />
                <span>mm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button type="submit">
            <Save size={18} />
            Salvar configurações
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={restaurarPadrao}
          >
            <RotateCcw size={18} />
            Restaurar padrão
          </button>
        </div>
      </form>
    </div>
  );
}

export default Configuracoes;