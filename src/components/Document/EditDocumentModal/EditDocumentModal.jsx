
import { useEffect, useState } from "react";
import {
  FiX,
  FiFileText,
  FiInfo,
  FiTag,
  FiArrowLeft,
  FiLoader,
} from "react-icons/fi";
import { fetchTags, updateDocument } from "../../../services/documentService";
import "./EditDocumentModal.css";

const SETORES = [
  { value: "tecnico", label: "Técnico" },
  { value: "normativo", label: "Normativo" },
  { value: "juridico", label: "Jurídico" },
  { value: "qualitativo", label: "Qualitativo" },
  { value: "NAO_ATRIBUIDO", label: "Não atribuído" },
];

const NIVEIS_ACESSO = [
  { value: "basico", label: "Básico" },
  { value: "comercial", label: "Comercial" },
  { value: "militar", label: "Militar" },
  { value: "operador", label: "Operador" },
];

function normalizeValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function findOptionValue(value, options, fallback = "") {
  if (!value) return fallback;

  const normalized = normalizeValue(value);
  const option = options.find(
    (item) =>
      normalizeValue(item.value) === normalized ||
      normalizeValue(item.label) === normalized
  );

  if (option) return option.value;

  if (String(value).toUpperCase() === "NAO_ATRIBUIDO") {
    return "NAO_ATRIBUIDO";
  }

  return fallback;
}

function getTagName(tag) {
  return typeof tag === "string" ? tag : tag?.nome || "";
}

function getTagId(tag) {
  return typeof tag === "object"
    ? tag?.id_etiqueta ?? tag?.id ?? null
    : null;
}

function EditDocumentModal({
  document,
  onClose,
  onBackToDetails,
  onDocumentUpdated,
  updateDocumentFn = updateDocument,
  fetchTagsFn = fetchTags,
}) {
  const [name, setName] = useState(document?.nome || "");
  const [sector, setSector] = useState(
    findOptionValue(document?.setor, SETORES)
  );
  const [accessLevel, setAccessLevel] = useState(
    findOptionValue(document?.nivel, NIVEIS_ACESSO, "basico")
  );
  const [selectedTags, setSelectedTags] = useState(
    (document?.etiquetas || [])
      .map((tag) => ({
        id_etiqueta: getTagId(tag),
        nome: getTagName(tag),
      }))
      .filter((tag) => tag.nome)
  );
  const [tagSearch, setTagSearch] = useState("");
  const [tagOptions, setTagOptions] = useState([]);
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (tagSearch.trim().length < 2) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoadingTags(true);

      try {
        const tags = await fetchTagsFn(tagSearch);

        if (!cancelled) {
          const selectedNames = new Set(
            selectedTags.map((tag) => normalizeValue(tag.nome))
          );

          setTagOptions(
            (Array.isArray(tags) ? tags : []).filter(
              (tag) =>
                !selectedNames.has(normalizeValue(getTagName(tag)))
            )
          );
        }
      } catch {
        if (!cancelled) {
          setTagOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingTags(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tagSearch, fetchTagsFn, selectedTags]);

  function handleTagSearchChange(event) {
    const value = event.target.value;

    setTagSearch(value);
    setShowTagOptions(true);

    if (value.trim().length < 2) {
      setTagOptions([]);
      setLoadingTags(false);
    }
  }

  function handleAddTag(tag) {
    const tagName = getTagName(tag).trim();

    if (!tagName) return;

    const alreadySelected = selectedTags.some(
      (item) => normalizeValue(item.nome) === normalizeValue(tagName)
    );

    if (!alreadySelected) {
      setSelectedTags((current) => [
        ...current,
        {
          id_etiqueta: getTagId(tag),
          nome: tagName,
        },
      ]);
    }

    setTagSearch("");
    setTagOptions([]);
    setLoadingTags(false);
    setShowTagOptions(false);
  }

  function handleRemoveTag(tagToRemove) {
    setSelectedTags((current) =>
      current.filter(
        (tag) =>
          !(
            tag.id_etiqueta === tagToRemove.id_etiqueta &&
            tag.nome === tagToRemove.nome
          )
      )
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      window.alert("O nome do documento é obrigatório.");
      return;
    }

    if (!sector) {
      window.alert("O setor responsável é obrigatório.");
      return;
    }

    if (!accessLevel) {
      window.alert("O nível de acesso é obrigatório.");
      return;
    }

    if (!document?.id_documento) {
      window.alert("Não foi possível identificar o documento para edição.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        nome: name.trim(),
        setor: sector,
        nivel: accessLevel,
        etiquetas: selectedTags.map(
          (tag) => tag.id_etiqueta ?? tag.nome
        ),
      };

      const updatedDocument = await updateDocumentFn(
        document.id_documento,
        payload
      );

      if (onDocumentUpdated) {
        onDocumentUpdated({
          ...document,
          ...updatedDocument,
          ...payload,
          etiquetas: selectedTags,
        });
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Não foi possível salvar as alterações."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="edit-document-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-document-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section className="edit-document-modal">
        <header className="edit-document-header">
          <div>
            <span className="edit-document-eyebrow">
              Editar documento
            </span>
            <h2 id="edit-document-title">
              {document?.nome || "Documento"}
            </h2>
          </div>

          <button
            type="button"
            className="edit-document-close"
            onClick={onClose}
            aria-label="Fechar edição"
          >
            <FiX size={20} />
          </button>
        </header>

        <form className="edit-document-form" onSubmit={handleSubmit}>
          <div className="edit-document-file">
            <FiFileText size={22} aria-hidden="true" />
            <div>
              <strong>
                {document?.nome || "Arquivo do documento"}
              </strong>
              <span>
                {document?.tipo_arquivo?.toUpperCase() || "ARQUIVO"} ·
                {" "}O arquivo não pode ser alterado nesta tela.
              </span>
            </div>
          </div>

          <div className="edit-document-field">
            <label htmlFor="edit-document-name">
              Nome do documento *
            </label>
            <input
              id="edit-document-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="edit-document-fields-row">
            <div className="edit-document-field">
              <label htmlFor="edit-document-sector">
                Setor responsável *
              </label>
              <select
                id="edit-document-sector"
                value={sector}
                onChange={(event) => setSector(event.target.value)}
                required
              >
                <option value="">Selecione um setor</option>
                {SETORES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="edit-document-field">
              <label htmlFor="edit-document-level">
                Nível de acesso *
              </label>
              <select
                id="edit-document-level"
                value={accessLevel}
                onChange={(event) => setAccessLevel(event.target.value)}
                required
              >
                <option value="">Selecione um nível</option>
                {NIVEIS_ACESSO.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="edit-document-field">
            <label htmlFor="edit-document-tags">Etiquetas</label>

            <div className="edit-document-tags-input">
              {selectedTags.map((tag, index) => (
                <span
                  className="edit-document-tag"
                  key={`${tag.id_etiqueta ?? tag.nome}-${index}`}
                >
                  {tag.nome}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remover etiqueta ${tag.nome}`}
                  >
                    <FiX size={12} />
                  </button>
                </span>
              ))}

              <input
                id="edit-document-tags"
                value={tagSearch}
                onChange={handleTagSearchChange}
                onFocus={() => setShowTagOptions(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && tagOptions.length > 0) {
                    event.preventDefault();
                    handleAddTag(tagOptions[0]);
                  }

                  if (event.key === "Escape") {
                    setShowTagOptions(false);
                  }
                }}
                placeholder="Pesquisar etiquetas..."
                autoComplete="off"
              />
            </div>

            {showTagOptions && tagSearch.trim().length >= 2 && (
              <div className="edit-document-tag-options" role="listbox">
                {loadingTags ? (
                  <p className="edit-document-tag-message">
                    <FiLoader className="edit-document-spinner" />
                    {" "}Buscando etiquetas...
                  </p>
                ) : tagOptions.length > 0 ? (
                  tagOptions.map((tag, index) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      key={`${getTagId(tag) ?? getTagName(tag)}-${index}`}
                      onClick={() => handleAddTag(tag)}
                    >
                      <FiTag size={14} />
                      {getTagName(tag)}
                    </button>
                  ))
                ) : (
                  <p className="edit-document-tag-message">
                    Nenhuma etiqueta encontrada.
                  </p>
                )}
              </div>
            )}

            <small>Digite pelo menos 2 caracteres para pesquisar.</small>
          </div>

          <div className="edit-document-info">
            <FiInfo size={17} />
            <span>
              O arquivo original será mantido. Apenas os dados do documento
              serão atualizados.
            </span>
          </div>

          {error && (
            <p className="edit-document-error" role="alert">
              {error}
            </p>
          )}

          <footer className="edit-document-actions">
            <button
              type="button"
              className="edit-document-back"
              onClick={onBackToDetails}
              disabled={saving}
            >
              <FiArrowLeft size={16} />
              Voltar aos detalhes
            </button>

            <div className="edit-document-actions-right">
              <button
                type="button"
                className="edit-document-cancel"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="edit-document-save"
                disabled={saving}
              >
                {saving && (
                  <FiLoader className="edit-document-spinner" />
                )}
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default EditDocumentModal;
