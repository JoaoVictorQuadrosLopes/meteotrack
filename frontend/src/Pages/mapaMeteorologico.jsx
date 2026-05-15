import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import {
  CloudSun,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  RefreshCcw,
  MapPin,
  Search,
  Thermometer,
  Navigation
} from "lucide-react";

import api from "../services/api";

function criarIconeTemperatura(temperatura) {
  let cor = "#22c55e";

  if (temperatura <= 15) {
    cor = "#0284c7";
  } else if (temperatura > 15 && temperatura <= 25) {
    cor = "#22c55e";
  } else if (temperatura > 25 && temperatura <= 32) {
    cor = "#f59e0b";
  } else if (temperatura > 32) {
    cor = "#ef4444";
  }

  return L.divIcon({
    className: "custom-weather-marker",
    html: `
      <div style="
        width: 42px;
        height: 42px;
        background: ${cor};
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.28);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 900;
        font-size: 12px;
      ">
        ${Math.round(temperatura)}°
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -18]
  });
}

function CentralizarMapa({ locais }) {
  const map = useMap();

  useEffect(() => {
    if (!locais || locais.length === 0) return;

    const bounds = locais.map((local) => [
      Number(local.latitude),
      Number(local.longitude)
    ]);

    map.fitBounds(bounds, {
      padding: [70, 70]
    });
  }, [locais, map]);

  return null;
}

function MoverParaLocal({ local }) {
  const map = useMap();

  useEffect(() => {
    if (!local) return;

    map.flyTo(
      [Number(local.latitude), Number(local.longitude)],
      10,
      {
        duration: 1.2
      }
    );
  }, [local, map]);

  return null;
}

function MapaMeteorologico() {
  const [locais, setLocais] = useState([]);
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarMapa() {
    try {
      setCarregando(true);
      setErro("");

      const responseLocais = await api.get("/locais");
      const locaisCadastrados = responseLocais.data;

      const locaisComClima = await Promise.all(
        locaisCadastrados.map(async (local) => {
          try {
            const responseClima = await api.get("/weather/atual", {
              params: {
                latitude: local.latitude,
                longitude: local.longitude
              }
            });

            return {
              ...local,
              clima: responseClima.data.current,
              erroClima: false
            };
          } catch (error) {
            console.error("Erro ao buscar clima:", error);

            return {
              ...local,
              clima: null,
              erroClima: true
            };
          }
        })
      );

      setLocais(locaisComClima);

      if (locaisComClima.length > 0) {
        setLocalSelecionado(locaisComClima[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar mapa:", error);
      setErro("Não foi possível carregar o mapa meteorológico.");
    } finally {
      setCarregando(false);
    }
  }

  function selecionarLocal(local) {
    setLocalSelecionado(local);
  }

  function obterStatusTemperatura(temperatura) {
    const temp = Number(temperatura || 0);

    if (temp <= 15) return "Frio";
    if (temp <= 25) return "Agradável";
    if (temp <= 32) return "Quente";
    return "Muito quente";
  }

  const locaisFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return locais;

    const termo = termoBusca.toLowerCase();

    return locais.filter((local) => {
      return (
        local.nome?.toLowerCase().includes(termo) ||
        local.cidade?.toLowerCase().includes(termo) ||
        local.estado?.toLowerCase().includes(termo)
      );
    });
  }, [locais, termoBusca]);

  const resumoMapa = useMemo(() => {
    const locaisValidos = locais.filter((local) => local.clima);

    if (locaisValidos.length === 0) {
      return {
        maisQuente: "--",
        maisFrio: "--",
        mediaTemperatura: "--"
      };
    }

    const temperaturas = locaisValidos.map((local) =>
      Number(local.clima.temperature_2m || 0)
    );

    const maior = Math.max(...temperaturas);
    const menor = Math.min(...temperaturas);

    const soma = temperaturas.reduce((total, item) => total + item, 0);
    const media = soma / temperaturas.length;

    return {
      maisQuente: maior.toFixed(1),
      maisFrio: menor.toFixed(1),
      mediaTemperatura: media.toFixed(1)
    };
  }, [locais]);

  useEffect(() => {
    carregarMapa();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Mapa Meteorológico</h1>
          <p className="page-description">
            Visualize os locais monitorados no mapa com indicadores climáticos
            em tempo real.
          </p>
        </div>

        <button type="button" onClick={carregarMapa}>
          <RefreshCcw size={18} />
          Atualizar mapa
        </button>
      </div>

      {erro && <div className="message-box error-message">{erro}</div>}

      <div className="map-summary-grid">
        <div className="card">
          <span>Locais no mapa</span>
          <strong>{locais.length}</strong>
        </div>

        <div className="card">
          <span>Temperatura média</span>
          <strong>{resumoMapa.mediaTemperatura}°C</strong>
        </div>

        <div className="card">
          <span>Local mais quente</span>
          <strong>{resumoMapa.maisQuente}°C</strong>
        </div>

        <div className="card">
          <span>Local mais frio</span>
          <strong>{resumoMapa.maisFrio}°C</strong>
        </div>
      </div>

      {carregando ? (
        <div className="table-card">
          <p>Carregando mapa meteorológico...</p>
        </div>
      ) : locais.length === 0 ? (
        <div className="empty-state">
          <MapPin size={42} />
          <h3>Nenhum local cadastrado</h3>
          <p>
            Cadastre locais na tela “Locais Monitorados” para visualizar no mapa.
          </p>
        </div>
      ) : (
        <div className="professional-map-layout">
          <div className="professional-map-card">
            <MapContainer
              center={[locais[0].latitude, locais[0].longitude]}
              zoom={8}
              scrollWheelZoom={true}
              className="professional-weather-map"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <CentralizarMapa locais={locais} />
              <MoverParaLocal local={localSelecionado} />

              {locais.map((local) => {
                const temperatura = Number(local.clima?.temperature_2m || 0);

                return (
                  <Marker
                    key={local.id}
                    position={[
                      Number(local.latitude),
                      Number(local.longitude)
                    ]}
                    icon={criarIconeTemperatura(temperatura)}
                    eventHandlers={{
                      click: () => selecionarLocal(local)
                    }}
                  >
                    <Popup>
                      <div className="map-popup">
                        <strong>{local.nome}</strong>
                        <span>
                          {local.cidade}
                          {local.estado ? ` - ${local.estado}` : ""}
                        </span>
                        <p>Temperatura: {local.clima?.temperature_2m ?? "--"}°C</p>
                        <p>Umidade: {local.clima?.relative_humidity_2m ?? "--"}%</p>
                        <p>Vento: {local.clima?.wind_speed_10m ?? "--"} km/h</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            <div className="map-legend">
              <h4>Legenda</h4>

              <div>
                <span className="legend-dot cold"></span>
                Até 15°C
              </div>

              <div>
                <span className="legend-dot normal"></span>
                16°C a 25°C
              </div>

              <div>
                <span className="legend-dot hot"></span>
                26°C a 32°C
              </div>

              <div>
                <span className="legend-dot extreme"></span>
                Acima de 32°C
              </div>
            </div>
          </div>

          <div className="professional-map-panel">
            <div className="map-search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar local..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>

            <div className="selected-weather-panel">
              <h2>Local selecionado</h2>

              {localSelecionado ? (
                <>
                  <div className="selected-place-card">
                    <div className="weather-icon">
                      <CloudSun size={30} />
                    </div>

                    <div>
                      <h3>{localSelecionado.nome}</h3>
                      <p>
                        {localSelecionado.cidade}
                        {localSelecionado.estado
                          ? ` - ${localSelecionado.estado}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {localSelecionado.erroClima ? (
                    <div className="weather-error">
                      Não foi possível carregar o clima deste local.
                    </div>
                  ) : (
                    <>
                      <div className="big-weather-number">
                        <strong>
                          {localSelecionado.clima?.temperature_2m ?? "--"}°C
                        </strong>
                        <span>
                          {obterStatusTemperatura(
                            localSelecionado.clima?.temperature_2m
                          )}
                        </span>
                      </div>

                      <div className="map-weather-list">
                        <div>
                          <Thermometer size={18} />
                          <span>Sensação térmica</span>
                          <strong>
                            {localSelecionado.clima?.apparent_temperature ??
                              "--"}
                            °C
                          </strong>
                        </div>

                        <div>
                          <Droplets size={18} />
                          <span>Umidade</span>
                          <strong>
                            {localSelecionado.clima?.relative_humidity_2m ??
                              "--"}
                            %
                          </strong>
                        </div>

                        <div>
                          <Wind size={18} />
                          <span>Vento</span>
                          <strong>
                            {localSelecionado.clima?.wind_speed_10m ?? "--"}{" "}
                            km/h
                          </strong>
                        </div>

                        <div>
                          <Gauge size={18} />
                          <span>Pressão</span>
                          <strong>
                            {localSelecionado.clima?.pressure_msl ?? "--"} hPa
                          </strong>
                        </div>

                        <div>
                          <CloudRain size={18} />
                          <span>Chuva</span>
                          <strong>
                            {localSelecionado.clima?.precipitation ?? "--"} mm
                          </strong>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p>Selecione um marcador no mapa.</p>
              )}
            </div>

            <div className="map-location-list">
              <h3>Locais monitorados</h3>

              {locaisFiltrados.map((local) => (
                <button
                  key={local.id}
                  type="button"
                  className={`map-location-item ${
                    localSelecionado?.id === local.id ? "active" : ""
                  }`}
                  onClick={() => selecionarLocal(local)}
                >
                  <div>
                    <strong>{local.nome}</strong>
                    <span>
                      {local.cidade}
                      {local.estado ? ` - ${local.estado}` : ""}
                    </span>
                  </div>

                  <div className="map-location-temp">
                    <Navigation size={15} />
                    {local.clima?.temperature_2m ?? "--"}°C
                  </div>
                </button>
              ))}

              {locaisFiltrados.length === 0 && (
                <p className="map-empty-search">
                  Nenhum local encontrado com esse termo.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapaMeteorologico;