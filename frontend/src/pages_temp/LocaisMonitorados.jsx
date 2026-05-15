import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  LocateFixed,
  Search,
  Trash2,
  Plus,
  Building2,
  Globe2
} from "lucide-react";
import api from "../services/api";

function LocaisMonitorados() {
  const navigate = useNavigate();

  const [locais, setLocais] = useState([]);
  const [buscaCidade, setBuscaCidade] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);
  const [carregandoCidade, setCarregandoCidade] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    cidade: "",
    estado: "",
    pais: "Brasil",
    latitude: "",
    longitude: "",
    tipo: "Cidade"
  });

  async function carregarLocais() {
    try {
      const response = await api.get("/locais");
      setLocais(response.data);
    } catch (error) {
      console.error("Erro ao carregar locais:", error);
      setMensagem("Erro ao carregar locais monitorados.");
    }
  }

  async function buscarCidade() {
    if (!buscaCidade.trim()) {
      setMensagem("Digite o nome de uma cidade para buscar.");
      return;
    }

    try {
      setCarregandoCidade(true);
      setMensagem("Buscando cidade...");

      const response = await api.get("/weather/buscar-cidade", {
        params: {
          cidade: buscaCidade
        }
      });

      const dados = response.data;

      setForm({
        nome: `Estação ${dados.cidade || dados.nome}`,
        cidade: dados.cidade || dados.nome,
        estado: dados.estado || "",
        pais: dados.pais || "Brasil",
        latitude: dados.latitude,
        longitude: dados.longitude,
        tipo: "Cidade"
      });

      setMensagem("Cidade encontrada! Confira os dados e clique em cadastrar.");
    } catch (error) {
      console.error("Erro ao buscar cidade:", error);
      setMensagem("Não foi possível encontrar essa cidade.");
    } finally {
      setCarregandoCidade(false);
    }
  }

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      setMensagem("Seu navegador não suporta localização automática.");
      return;
    }

    setCarregandoLocalizacao(true);
    setMensagem("Solicitando permissão de localização...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setForm({
          nome: "Minha localização atual",
          cidade: "Local atual",
          estado: "",
          pais: "Brasil",
          latitude,
          longitude,
          tipo: "Localização atual"
        });

        setMensagem("Localização capturada! Agora é só cadastrar.");
        setCarregandoLocalizacao(false);
      },
      (error) => {
        console.error("Erro ao obter localização:", error);

        setMensagem(
          "Não foi possível acessar sua localização. Verifique a permissão do navegador."
        );

        setCarregandoLocalizacao(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  async function cadastrarLocal(e) {
    e.preventDefault();

    if (!form.nome || !form.cidade || !form.latitude || !form.longitude) {
      setMensagem(
        "Busque uma cidade, use sua localização ou preencha os dados manualmente."
      );
      return;
    }

    try {
      await api.post("/locais", form);

      setForm({
        nome: "",
        cidade: "",
        estado: "",
        pais: "Brasil",
        latitude: "",
        longitude: "",
        tipo: "Cidade"
      });

      setBuscaCidade("");
      setMensagem("Local cadastrado com sucesso!");

      carregarLocais();
    } catch (error) {
      console.error("Erro ao cadastrar local:", error);
      setMensagem("Erro ao cadastrar local.");
    }
  }

  async function excluirLocal(id) {
    const confirmar = confirm("Deseja excluir este local?");

    if (!confirmar) return;

    try {
      await api.delete(`/locais/${id}`);
      setMensagem("Local excluído com sucesso.");
      carregarLocais();
    } catch (error) {
      console.error("Erro ao excluir local:", error);
      setMensagem("Erro ao excluir local.");
    }
  }

  useEffect(() => {
    carregarLocais();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Locais Monitorados</h1>
          <p className="page-description">
            Gerencie os locais que serão acompanhados pelo sistema meteorológico.
          </p>
        </div>
      </div>

      <div className="location-hero">
        <div>
          <span className="hero-label">Cadastro inteligente</span>
          <h2>Adicione locais sem digitar coordenadas</h2>
          <p>
            Busque pelo nome da cidade ou permita que o navegador identifique sua
            localização atual. O sistema preenche as coordenadas automaticamente.
          </p>
        </div>

        <div className="hero-icon">
          <MapPin size={46} />
        </div>
      </div>

      <div className="local-actions-grid">
        <div className="action-card highlight-card">
          <div className="action-icon">
            <Search size={26} />
          </div>

          <div>
            <h3>Buscar por cidade</h3>
            <p>
              Digite cidade e estado. Exemplo: Cascavel PR, Toledo PR ou São
              Paulo SP.
            </p>
          </div>

          <div className="search-row">
            <input
              type="text"
              placeholder="Ex: Cascavel PR"
              value={buscaCidade}
              onChange={(e) => setBuscaCidade(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  buscarCidade();
                }
              }}
            />

            <button type="button" onClick={buscarCidade}>
              {carregandoCidade ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        <div className="action-card">
          <div className="action-icon">
            <LocateFixed size={26} />
          </div>

          <div>
            <h3>Usar localização atual</h3>
            <p>
              O navegador pedirá permissão para capturar o local onde você está.
            </p>
          </div>

          <button type="button" onClick={usarMinhaLocalizacao}>
            {carregandoLocalizacao
              ? "Obtendo localização..."
              : "Usar localização"}
          </button>
        </div>
      </div>

      {mensagem && <div className="message-box">{mensagem}</div>}

      <form className="modern-location-form" onSubmit={cadastrarLocal}>
        <div className="form-header">
          <div>
            <h3>Novo local monitorado</h3>
            <p>Confira os dados antes de cadastrar.</p>
          </div>

          <Plus size={24} />
        </div>

        <div className="form-group">
          <label>Nome do local</label>
          <input
            type="text"
            placeholder="Ex: Estação Centro"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Cidade</label>
          <input
            type="text"
            placeholder="Ex: Cascavel"
            value={form.cidade}
            onChange={(e) => setForm({ ...form, cidade: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Estado</label>
          <input
            type="text"
            placeholder="Ex: Paraná"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>País</label>
          <input
            type="text"
            placeholder="Brasil"
            value={form.pais}
            onChange={(e) => setForm({ ...form, pais: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Tipo do local</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option>Cidade</option>
            <option>Fazenda</option>
            <option>Estação meteorológica</option>
            <option>Empresa</option>
            <option>Escola</option>
            <option>Localização atual</option>
          </select>
        </div>

        <div className="hidden-coordinates">
          <input
            type="hidden"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
          />

          <input
            type="hidden"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
          />
        </div>

        <button type="submit" className="submit-button">
          Cadastrar local
        </button>
      </form>

      <div className="section-title">
        <MapPin size={22} />
        <h2>Locais cadastrados</h2>
      </div>

      <div className="places-grid">
        {locais.map((local) => (
          <div className="place-card modern-place-card" key={local.id}>
            <div className="place-top">
              <div className="place-avatar">
                <MapPin size={24} />
              </div>

              <span className="place-type">{local.tipo || "Local"}</span>
            </div>

            <h3>{local.nome}</h3>

            <div className="place-location">
              <Building2 size={18} />
              <span>
                {local.cidade}
                {local.estado ? ` - ${local.estado}` : ""}
              </span>
            </div>

            <div className="place-location">
              <Globe2 size={18} />
              <span>{local.pais || "Brasil"}</span>
            </div>

            <button
              type="button"
              className="full-button"
              onClick={() => navigate(`/local/${local.id}`)}
            >
              Ver detalhes
            </button>

            <button
              className="danger-button full-button"
              onClick={() => excluirLocal(local.id)}
            >
              <Trash2 size={18} />
              Excluir local
            </button>
          </div>
        ))}

        {locais.length === 0 && (
          <div className="empty-state">
            <MapPin size={42} />
            <h3>Nenhum local cadastrado</h3>
            <p>Busque uma cidade ou use sua localização para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocaisMonitorados;