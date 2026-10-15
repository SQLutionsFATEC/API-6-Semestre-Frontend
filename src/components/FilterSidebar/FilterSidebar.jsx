import { useEffect, useState, useRef } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiRotateCcw,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { fetchAllAvailableTags } from "../../services/documentService";
import "./FilterSidebar.css";

const EMPTY_FILTERS = {
  tags: [],
  tipo: [],
  data_atualizacao: "",
};

const SECTORS = [
  { label: "Técnico", value: "tecnico" },
  { label: "Normativo", value: "normativo" },
  { label: "Jurídico", value: "juridico" },
  { label: "Qualitativo", value: "qualitativo" },
];

function getSectorLabel(value) {
  const sector = SECTORS.find(
    (item) =>
      item.value === value ||
      item.label.toLowerCase() === String(value).toLowerCase()
  );
  return sector ? sector.label : value;
}

function getSectorValue(labelOrValue) {
  const sector = SECTORS.find(
    (item) =>
      item.value === labelOrValue ||
      item.label.toLowerCase() === String(labelOrValue).toLowerCase()
  );
  return sector ? sector.value : labelOrValue;
}

function getTagId(tag) {
  if (typeof tag === "string") return tag;
  return tag?.id_etiqueta ?? tag?.id ?? tag?.pk;
}

function getTagName(tag) {
  if (typeof tag === "string") return tag;
  return tag?.nome ?? tag?.name ?? tag?.etiqueta ?? "";
}

function normalizeSearchValue(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function copyFilters(filters) {
  return {
    tags: [...(filters?.tags ?? [])],
    tipo: [...(filters?.tipo ?? []).map(getSectorValue)],
    data_atualizacao: filters?.data_atualizacao ?? "",
  };
}

function isValidFilterDate(value) {
  if (!value) return true;
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function FilterSidebar({
  isOpen,
  onClose,
  filters = EMPTY_FILTERS,
  onApplyFilters,
  onClearFilters,
}) {
  const [draftFilters, setDraftFilters] = useState(() =>
    copyFilters(filters)
  );
  const [tagSearch, setTagSearch] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagError, setTagError] = useState("");
  const [isSectorSelectOpen, setIsSectorSelectOpen] = useState(false);
  const sectorSelectRef = useRef(null);

  const normalizedTagSearch = normalizeSearchValue(tagSearch.trim());
  const hasTagSearch = normalizedTagSearch.length > 0;
  const filteredTags = hasTagSearch
    ? availableTags.filter((tag) =>
      normalizeSearchValue(getTagName(tag)).includes(normalizedTagSearch)
    )
    : [];

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- o rascunho deve refletir os filtros ao abrir o modal.
      setDraftFilters(copyFilters(filters));
      setTagSearch("");
      setIsSectorSelectOpen(false);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingTags(true);
      setTagError("");

      try {
        const result = await fetchAllAvailableTags();

        if (!cancelled) {
          setAvailableTags(Array.isArray(result) ? result : []);
        }
      } catch {
        if (!cancelled) {
          setAvailableTags([]);
          setTagError("Não foi possível carregar as etiquetas.");
        }
      } finally {
        if (!cancelled) {
          setLoadingTags(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  function toggleTag(tagName) {
    setDraftFilters((current) => ({
      ...current,
      tags: current.tags.includes(tagName)
        ? current.tags.filter((name) => name !== tagName)
        : [...current.tags, tagName],
    }));
  }

  function toggleSector(sector) {
    const value = getSectorValue(sector);
    setDraftFilters((current) => ({
      ...current,
      tipo: current.tipo.includes(value)
        ? current.tipo.filter((item) => item !== value)
        : [...current.tipo, value],
    }));
  }

  function handleClearFilters() {
    const clearedFilters = copyFilters(EMPTY_FILTERS);

    setDraftFilters(clearedFilters);
    setTagSearch("");
    setTagError("");
    setIsSectorSelectOpen(false);

    onClearFilters(clearedFilters);
  }

  function handleApplyFilters(event) {
    event.preventDefault();

    const nextFilters = copyFilters(draftFilters);
    if (!isValidFilterDate(nextFilters.data_atualizacao)) {
      nextFilters.data_atualizacao = "";
    }
    onApplyFilters(nextFilters);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="filter-overlay"
      data-testid="filter-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        className="filter-sidebar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sidebar-title"
      >
        <header className="filter-sidebar-header">
          <div className="filter-sidebar-heading">
            <FiFilter size={20} aria-hidden="true" />
            <h2 id="filter-sidebar-title">Filtros</h2>
          </div>

          <button
            type="button"
            className="filter-close-button"
            aria-label="Fechar filtros"
            onClick={onClose}
          >
            <FiX size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="filter-sidebar-form" onSubmit={handleApplyFilters}>
          <section className="filter-section">
            <h3>Etiquetas</h3>

            <label
              className="filter-search-label"
              htmlFor="filter-tag-search"
            >
              Pesquisar etiquetas
            </label>

            <div className="filter-tag-search">
              <FiSearch size={16} aria-hidden="true" />
              <input
                id="filter-tag-search"
                type="search"
                value={tagSearch}
                placeholder="Pesquisar etiquetas"
                onChange={(event) => setTagSearch(event.target.value)}
              />
            </div>

            {draftFilters.tags.length > 0 && (
              <div className="filter-selected-tags">
                {draftFilters.tags.map((tagName) => (
                  <span className="filter-selection-chip" key={tagName}>
                    {tagName}
                    <button
                      type="button"
                      aria-label={`Remover etiqueta ${tagName}`}
                      onClick={() => toggleTag(tagName)}
                    >
                      <FiX size={14} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {hasTagSearch && loadingTags && (
              <p className="filter-helper-text" role="status">
                Carregando etiquetas...
              </p>
            )}

            {tagError && (
              <p className="filter-error-message" role="alert">
                {tagError}
              </p>
            )}

            {hasTagSearch &&
              !loadingTags &&
              !tagError &&
              filteredTags.length === 0 && (
                <p className="filter-helper-text">
                  Nenhuma etiqueta encontrada.
                </p>
              )}

            {hasTagSearch && filteredTags.length > 0 && (
              <div className="filter-options filter-tag-options">
                {filteredTags.map((tag, index) => {
                  const tagId = getTagId(tag);
                  const tagName = getTagName(tag);

                  if (tagId == null || !tagName) return null;

                  return (
                    <label
                      className="filter-option"
                      key={tagId ?? `${tagName}-${index}`}
                    >
                      <input
                        type="checkbox"
                        checked={draftFilters.tags.includes(tagName)}
                        onChange={() => toggleTag(tagName)}
                      />
                      <span>{tagName}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <section className="filter-section">
            <h3>Setor/Tipo</h3>

            <div className="filter-multiselect" ref={sectorSelectRef}>
              <div className="filter-multiselect-trigger">
                <div
                  className="filter-multiselect-values"
                  onClick={() => setIsSectorSelectOpen(true)}
                >
                  {draftFilters.tipo.length > 0 ? (
                    draftFilters.tipo.map((sectorValue) => {
                      const label = getSectorLabel(sectorValue);
                      return (
                        <span className="filter-selection-chip" key={sectorValue}>
                          {label}
                          <button
                            type="button"
                            aria-label={`Remover ${label}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSector(sectorValue);
                            }}
                          >
                            <FiX size={14} aria-hidden="true" />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="filter-multiselect-placeholder">
                      Selecionar setor/tipo
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="filter-multiselect-toggle"
                  aria-label={`Selecionar setor/tipo${draftFilters.tipo.length > 0
                    ? `: ${draftFilters.tipo.map(getSectorLabel).join(", ")}`
                    : ""
                    }`}
                  aria-expanded={isSectorSelectOpen}
                  aria-controls="filter-sector-options"
                  onClick={() => setIsSectorSelectOpen((isOpen) => !isOpen)}
                >
                  {isSectorSelectOpen ? (
                    <FiChevronUp size={18} aria-hidden="true" />
                  ) : (
                    <FiChevronDown size={18} aria-hidden="true" />
                  )}
                </button>
              </div>

              {isSectorSelectOpen && (
                <div
                  id="filter-sector-options"
                  className="filter-multiselect-options"
                  role="listbox"
                  aria-multiselectable="true"
                >
                  {SECTORS.map((sector) => (
                    <label className="filter-option" key={sector.value}>
                      <input
                        type="checkbox"
                        checked={draftFilters.tipo.includes(sector.value)}
                        onChange={() => toggleSector(sector.value)}
                      />
                      <span>{sector.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="filter-section">
            <h3>Data de atualização</h3>

            <label
              className="filter-search-label"
              htmlFor="filter-update-date"
            >
              Atualizado em
            </label>

            <input
              id="filter-update-date"
              className="filter-date-input"
              type="date"
              value={draftFilters.data_atualizacao}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  data_atualizacao: event.target.value,
                }))
              }
            />
          </section>

          <footer className="filter-sidebar-footer">
            <button
              type="button"
              className="filter-clear-button"
              onClick={handleClearFilters}
            >
              <FiRotateCcw size={16} aria-hidden="true" />
              Limpar filtros
            </button>

            <button type="submit" className="filter-apply-button">
              Aplicar filtros
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

export default FilterSidebar;
