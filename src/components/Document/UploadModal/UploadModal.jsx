import { useEffect, useRef, useState } from "react";
import {
  FiUploadCloud,
  FiFileText,
  FiTag,
  FiInfo,
  FiX,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { createDocument } from "../../../services/documentService";
import "./UploadModal.css";

function UploadModal({
  isOpen,
  onClose,
  createDocumentFn = createDocument,
  onDocumentCreated,
}) {
  const SETORES = [
    "Técnico",
    "Normativo",
    "Jurídico",
    "Qualitativo",
  ];

  const NIVEIS_ACESSO = [
    "Básico",
    "Comercial",
    "Militar",
  ];

  const INITIAL_FORM = {
    name: "",
    sector: "",
    accessLevel: "Básico",
  };

  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdInfo, setCreatedInfo] = useState({ fileName: "", sector: "" });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setFile(null);
    setError("");
    setIsSuccess(false);
    setIsDragging(false);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    if (onClose) onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const handleSelectFile = (selectedFile) => {
    if (!selectedFile) return;

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setFile(null);
      setError("Apenas arquivos no formato PDF são permitidos.");
      return;
    }

    setFile(selectedFile);
    setError("");

    setForm((prev) => ({
      ...prev,
      name: selectedFile.name,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Cadastro sem documento anexado não é permitido.");
      return;
    }

    if (!form.name.trim()) {
      setError("O nome do documento é obrigatório.");
      return;
    }

    if (!form.sector.trim()) {
      setError("O setor responsável é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createDocumentFn({
        nome: form.name.trim(),
        setor: form.sector.trim(),
        nivel: form.accessLevel,
        file,
      });

      setCreatedInfo({
        fileName: file.name,
        sector: form.sector,
      });
      setIsSuccess(true);

      if (onDocumentCreated) {
        onDocumentCreated(created);
      }
    } catch (err) {
      setError(err?.message || "Não foi possível cadastrar o documento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAnother = () => {
    setForm(INITIAL_FORM);
    setFile(null);
    setError("");
    setIsSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Implementar visualização do documento aqui posteriormente
  const handleViewDocument = () => {
    console.log("Visualização do documento será integrada futuramente.");
  };

  return (
    <div
      className="upload-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="upload-modal-container">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="upload-file-input"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleSelectFile(e.target.files[0]);
            }
          }}
        />
        {isSuccess ? (
          /* Modal 2: Feedback de Sucesso */
          <div className="upload-modal-content success-view">
            <button
              type="button"
              className="upload-modal-close success-close"
              onClick={handleClose}
              aria-label="Fechar"
            >
              <FiX size={20} />
            </button>

            <div className="success-header">
              <h2 className="success-title">Documento cadastrado com sucesso!</h2>
              <p className="success-subtitle">
                O arquivo foi enviado e processado pela API local.
              </p>
            </div>

            <div className="success-cards">
              <div className="success-card">
                <div className="success-card-icon-badge">
                  <FiFileText size={22} />
                </div>
                <div className="success-card-info">
                  <span className="success-card-label">Arquivo cadastrado</span>
                  <strong className="success-card-value">
                    {createdInfo.fileName}
                  </strong>
                </div>
              </div>

              <div className="success-card">
                <div className="success-card-icon-badge">
                  <FiTag size={22} />
                </div>
                <div className="success-card-info">
                  <span className="success-card-label">Tag identificada</span>
                  <strong className="success-card-value">
                    {createdInfo.sector}
                  </strong>
                </div>
              </div>
            </div>

            <div className="success-info-notice">
              <FiInfo size={18} className="success-info-icon" />
              <span>
                Você já pode visualizar ou editar este documento na listagem.
              </span>
            </div>

            <div className="success-actions">
              <button
                type="button"
                className="success-btn-register-another"
                onClick={handleRegisterAnother}
              >
                Cadastrar outro
              </button>
              <button
                type="button"
                className="success-btn-view"
                onClick={handleViewDocument}
              >
                Ver documento
              </button>
            </div>
          </div>
        ) : (
          /* Modal 1: Formulário de Cadastro */
          <div className="upload-modal-content">
            <div className="upload-modal-header">
              <div className="upload-modal-header-texts">
                <h2 className="upload-modal-title">Cadastrar documento</h2>
                <p className="upload-modal-subtitle">
                  Os dados serão enviados para a API local.
                </p>
              </div>
              <button
                type="button"
                className="upload-modal-close"
                onClick={handleClose}
                aria-label="Fechar"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="upload-modal-form">
              <div
                className={`upload-dropzone ${isDragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleSelectFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Selecionar arquivo PDF"
              >
                {file ? (
                  <>
                    <FiFileText className="upload-dropzone-icon" size={38} />
                    <p className="upload-dropzone-title">{file.name}</p>
                    <p className="upload-dropzone-subtitle">
                      {(file.size / 1024 / 1024).toFixed(2)} MB — clique para trocar
                    </p>
                  </>
                ) : (
                  <>
                    <FiUploadCloud className="upload-dropzone-icon" size={38} />
                    <p className="upload-dropzone-title">
                      Arraste um PDF ou clique para selecionar
                    </p>
                    <p className="upload-dropzone-subtitle">
                      O backend aceita somente arquivos PDF.
                    </p>
                  </>
                )}
              </div>

              <div className="upload-form-group">
                <label htmlFor="document-name" className="upload-label">
                  Nome do documento *
                </label>
                <input
                  id="document-name"
                  type="text"
                  className="upload-input"
                  placeholder="Ex.: Manual de manutenção"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="upload-form-row">
                <div className="upload-form-group">
                  <label htmlFor="document-sector" className="upload-label">
                    Setor responsável *
                  </label>
                  <select
                    id="document-sector"
                    className="upload-select"
                    value={form.sector}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sector: e.target.value }))
                    }
                  >
                    <option value="">Selecione um setor</option>
                    {SETORES.map((setor) => (
                      <option key={setor} value={setor}>
                        {setor}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="upload-form-group">
                  <label htmlFor="document-level" className="upload-label">
                    Nível de acesso *
                  </label>
                  <select
                    id="document-level"
                    className="upload-select"
                    value={form.accessLevel}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        accessLevel: e.target.value,
                      }))
                    }
                  >
                    {NIVEIS_ACESSO.map((nivel) => (
                      <option key={nivel} value={nivel}>
                        {nivel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="upload-error-alert" role="alert">
                  <FiAlertCircle size={18} className="upload-error-icon" />
                  <span>{error}</span>
                </div>
              )}

              <div className="upload-modal-footer">
                <button
                  type="button"
                  className="upload-btn-cancel"
                  onClick={handleClose}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="upload-btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <FiLoader className="animate-spin" size={16} />}
                  {isSubmitting ? "Cadastrando..." : "Cadastrar documento"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadModal;
