
import { useEffect, useState } from "react";
import { FiX, FiSearch, FiFilter, FiRotateCcw } from "react-icons/fi";

import { fetchTags } from "../../services/documentService";
import "./FilterSidebar.css";

const EMPTY_FILTERS = {
  tags: [],
  tipo: [],
  data_atualizacao: "",
};

const SECTORS = [
  "Técnico",
  "Normativo",
  "Judiciário",
  "Qualitativo",
];

function getTagId(tag) {
  return tag.id_etiqueta ?? tag.id ?? tag.pk;
}

function getTagName(tag) {
  return tag.nome ?? tag.name ?? tag.etiqueta ?? "";
}

function copyFilters(filters) {
  return {
    tags: [...(filters?.tags ?? [])],
    tipo: [...(filters?.tipo ?? [])],
    data_atualizacao: filters?.data_atualizacao ?? "",
  };
}

function FilterSidebar({
  isOpen,
  onClose,
  filters = EMPTY_FILTERS,
  onApplyFilters,
}) {
  const [draftFilters, setDraftFilters] = useState(() =>
    copyFilters(filters)
  );
  const [tagSearch, setTagSearch] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagError, setTagError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDraftFilters(copyFilters(filters));
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const query = tagSearch.trim();

    if (query.length < 2) {
      setAvailableTags([]);
      setLoadingTags(false);
      setTagError("");
      return undefined;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoadingTags(true);
      setTagError("");

      try {
        const result = await fetchTags(query);

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
  }, [tagSearch, isOpen]);

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

  function toggleTag(tagId) {
    setDraftFilters((current) => ({
      ...current,
      tags: current.tags.includes(tagId)
        ? current.tags.filter((id) => id !== tagId)
        : [...current.tags, tagId],
    }));
  }

  function toggleSector(sector) {
    setDraftFilters((current) => ({
      ...current,
      tipo: current.tipo.includes(sector)
        ? current.tipo.filter((item) => item !== sector)
        : [...current.tipo, sector],
    }));
  }

  function handleClearFilters() {
    const clearedFilters = copyFilters(EMPTY_FILTERS);

    setDraftFilters(clearedFilters);
    setTagSearch("");
    setAvailableTags([]);
    setTagError("");

    onApplyFilters(clearedFilters);
    onClose();
  }

  function handleApplyFilters(event) {
    event.preventDefault();

    onApplyFilters(copyFilters(draftFilters));
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
                placeholder="Digite pelo menos 2 caracteres"
                onChange={(event) => setTagSearch(event.target.value)}
              />
            </div>

            {tagSearch.trim().length < 2 && (
              <p className="filter-helper-text">
                Digite pelo menos 2 caracteres para buscar etiquetas.
              </p>
            )}

            {loadingTags && (
              <p className="filter-helper-text" role="status">
                Carregando etiquetas...
              </p>
            )}

            {tagError && (
              <p className="filter-error-message" role="alert">
                {tagError}
              </p>
            )}

            {!loadingTags &&
              !tagError &&
              tagSearch.trim().length >= 2 &&
              availableTags.length === 0 && (
                <p className="filter-helper-text">
                  Nenhuma etiqueta encontrada.
                </p>
              )}

            {availableTags.length > 0 && (
              <div className="filter-options filter-tag-options">
                {availableTags.map((tag, index) => {
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
                        checked={draftFilters.tags.includes(tagId)}
                        onChange={() => toggleTag(tagId)}
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

            <div className="filter-options">
              {SECTORS.map((sector) => (
                <label className="filter-option" key={sector}>
                  <input
                    type="checkbox"
                    checked={draftFilters.tipo.includes(sector)}
                    onChange={() => toggleSector(sector)}
                  />
                  <span>{sector}</span>
                </label>
              ))}
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
