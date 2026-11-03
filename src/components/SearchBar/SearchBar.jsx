import { useState, useRef, useEffect } from "react";
import {
  FiSearch,
  FiFileText,
  FiTag,
  FiAlignLeft,
  FiX,
  FiHelpCircle,
} from "react-icons/fi";
import "./SearchBar.css";

const SEARCH_MODES = [
  {
    id: "nome",
    label: "Nome",
    icon: FiFileText,
    description: "Pesquisa diretamente pelo nome do arquivo do documento.",
    example: "Ex: relatorio, ata, contrato",
  },
  {
    id: "tags",
    label: "Tags",
    icon: FiTag,
    description: "Pesquisa pelas etiquetas (tags) cadastradas no documento.",
    example: "Ex: juridico, financeiro, tecnico",
  },
  {
    id: "conteudo",
    label: "Conteúdo",
    icon: FiAlignLeft,
    description:
      "Pesquisa semântica por Inteligência Artificial no conteúdo interno do texto.",
    example: "Ex: política de segurança da informação",
  },
];

function SearchBar({
  value = "",
  onChange,
  searchMode = "nome",
  onModeChange,
  placeholder = "Pesquise por nome, tag, conteúdo ou autor...",
}) {
  const [showHelp, setShowHelp] = useState(false);
  const helpRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setShowHelp(false);
      }
    }

    if (showHelp) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHelp]);

  function handleModeSelect(modeId) {
    if (onModeChange) {
      onModeChange(modeId);
    }
  }

  function handleClear() {
    if (onChange) {
      onChange("");
    }
  }

  return (
    <div className="search-bar-wrapper" ref={helpRef}>
      <div className="search-container">
        <span className="search-leading-icon" aria-hidden="true">
          <FiSearch size={18} />
        </span>

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange && onChange(event.target.value)}
          aria-label="Campo de pesquisa de documentos"
        />

        <div className="search-modes-group" role="tablist" aria-label="Modos de pesquisa">
          {SEARCH_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = searchMode === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`search-mode-pill ${isActive ? "active" : ""}`}
                onClick={() => handleModeSelect(mode.id)}
                title={`Pesquisar por ${mode.label}`}
              >
                <Icon size={13} className="pill-icon" aria-hidden="true" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {value && (
          <button
            type="button"
            className="search-clear-button"
            onClick={handleClear}
            aria-label="Limpar pesquisa"
            title="Limpar pesquisa"
          >
            <FiX size={15} />
          </button>
        )}

        <div className="search-divider" aria-hidden="true" />

        <button
          type="button"
          className={`search-help-trigger ${showHelp ? "active" : ""}`}
          onClick={() => setShowHelp((prev) => !prev)}
          aria-label="Ajuda sobre a pesquisa"
          aria-expanded={showHelp}
          title="Ajuda sobre como pesquisar"
        >
          <FiHelpCircle size={17} />
        </button>
      </div>

      {showHelp && (
        <div className="search-help-popover" role="dialog" aria-label="Como funciona a pesquisa">
          <div className="help-header">
            <span className="help-title">💡 Como pesquisar documentos?</span>
            <button
              type="button"
              className="help-close-button"
              onClick={() => setShowHelp(false)}
              aria-label="Fechar ajuda"
            >
              <FiX size={14} />
            </button>
          </div>
          <p className="help-intro">
            Clique nas pílulas <strong>Nome</strong>, <strong>Tags</strong> ou <strong>Conteúdo</strong> para escolher onde o termo será pesquisado:
          </p>

          <div className="help-modes-list">
            {SEARCH_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <div key={mode.id} className="help-mode-item">
                  <div className="help-mode-badge">
                    <Icon size={12} />
                    <span>{mode.label}</span>
                  </div>
                  <div className="help-mode-text">
                    <span className="help-mode-desc">{mode.description}</span>
                    <span className="help-mode-example">{mode.example}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;