import { useRef, useState } from "react";
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
      className="upload-modal-overlay fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[4px] animate-[uploadModalFadeIn_0.2s_ease-out]"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="upload-modal-container w-[min(620px,94vw)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="upload-file-input hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleSelectFile(e.target.files[0]);
            }
          }}
        />
        {isSuccess ? (
          /* Modal 2: Feedback de Sucesso */
          <div className="upload-modal-content success-view flex flex-col overflow-y-auto p-7 pb-6 relative">
            <button
              type="button"
              className="upload-modal-close success-close absolute top-[18px] right-5 p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer border-none bg-transparent"
              onClick={handleClose}
              aria-label="Fechar"
            >
              <FiX size={20} />
            </button>

            <div className="success-header text-center mt-1.5 mb-[22px]">
              <h2 className="success-title text-[23px] font-bold text-[#7A0026] mb-1.5 tracking-[-0.01em]">
                Documento cadastrado com sucesso!
              </h2>
              <p className="success-subtitle text-sm text-slate-500 m-0">
                O arquivo foi enviado e processado pela API local.
              </p>
            </div>

            <div className="success-cards flex flex-col gap-3 mb-[18px]">
              <div className="success-card flex items-center gap-3.5 bg-[#f0f4f9] rounded-xl px-4 py-3 border border-slate-200">
                <div className="success-card-icon-badge w-11 h-11 rounded-[10px] bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                  <FiFileText size={22} />
                </div>
                <div className="success-card-info flex flex-col min-w-0">
                  <span className="success-card-label text-xs text-slate-500 mb-0.5">
                    Arquivo cadastrado
                  </span>
                  <strong className="success-card-value text-[15px] font-bold text-slate-900 break-all">
                    {createdInfo.fileName}
                  </strong>
                </div>
              </div>

              <div className="success-card flex items-center gap-3.5 bg-[#f0f4f9] rounded-xl px-4 py-3 border border-slate-200">
                <div className="success-card-icon-badge w-11 h-11 rounded-[10px] bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                  <FiTag size={22} />
                </div>
                <div className="success-card-info flex flex-col min-w-0">
                  <span className="success-card-label text-xs text-slate-500 mb-0.5">
                    Tag identificada
                  </span>
                  <strong className="success-card-value text-[15px] font-bold text-slate-900 break-all">
                    {createdInfo.sector}
                  </strong>
                </div>
              </div>
            </div>

            <div className="success-info-notice flex items-center gap-2.5 text-[13px] text-slate-600 mb-6">
              <FiInfo size={18} className="success-info-icon text-blue-600 shrink-0" />
              <span>
                Você já pode visualizar ou editar este documento na listagem.
              </span>
            </div>

            <div className="success-actions flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-3 w-full">
              <button
                type="button"
                className="success-btn-register-another w-full sm:w-auto text-center bg-transparent border-[1.5px] border-[#7A0026] text-[#7A0026] hover:bg-[#fff1f5] rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
                onClick={handleRegisterAnother}
              >
                Cadastrar outro
              </button>
              <button
                type="button"
                className="success-btn-view w-full sm:w-auto text-center bg-[#7A0026] hover:bg-[#60001e] border-[1.5px] border-[#7A0026] hover:border-[#60001e] text-white rounded-lg px-[22px] py-2.5 text-sm font-semibold cursor-pointer transition-colors"
                onClick={handleViewDocument}
              >
                Ver documento
              </button>
            </div>
          </div>
        ) : (
          /* Modal 1: Formulário de Cadastro */
          <div className="upload-modal-content flex flex-col overflow-y-auto">
            <div className="upload-modal-header px-6 py-[18px] flex items-start justify-between border-b border-slate-100 bg-slate-50">
              <div className="upload-modal-header-texts flex flex-col">
                <h2 className="upload-modal-title text-xl font-bold text-slate-800 leading-[1.3] m-0">
                  Cadastrar documento
                </h2>
                <p className="upload-modal-subtitle text-[13px] text-slate-500 mt-1 leading-[1.4] m-0">
                  Os dados serão enviados para a API local.
                </p>
              </div>
              <button
                type="button"
                className="upload-modal-close p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer border-none bg-transparent"
                onClick={handleClose}
                aria-label="Fechar"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="upload-modal-form px-6 py-[22px] flex flex-col gap-[18px]">
              <div
                className={`upload-dropzone border-2 border-dashed rounded-xl px-4 py-6 text-center cursor-pointer flex flex-col items-center justify-center transition-all duration-200 ${
                  isDragging
                    ? "dragging bg-blue-100 border-blue-600 scale-[1.01]"
                    : file
                    ? "has-file bg-green-50 border-green-300 hover:bg-green-100/60 hover:border-green-400"
                    : "border-blue-300 bg-blue-50 hover:bg-sky-100 hover:border-blue-400"
                }`}
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
                    <FiFileText className="upload-dropzone-icon text-green-600 mb-2" size={38} />
                    <p className="upload-dropzone-title text-[15px] font-semibold text-slate-800 mb-1 break-all">
                      {file.name}
                    </p>
                    <p className="upload-dropzone-subtitle text-xs text-slate-500 m-0">
                      {(file.size / 1024 / 1024).toFixed(2)} MB — clique para trocar
                    </p>
                  </>
                ) : (
                  <>
                    <FiUploadCloud className="upload-dropzone-icon text-blue-600 mb-2" size={38} />
                    <p className="upload-dropzone-title text-[15px] font-semibold text-slate-800 mb-1 break-all">
                      Arraste um PDF ou clique para selecionar
                    </p>
                    <p className="upload-dropzone-subtitle text-xs text-slate-500 m-0">
                      O backend aceita somente arquivos PDF.
                    </p>
                  </>
                )}
              </div>

              <div className="upload-form-group flex flex-col w-full">
                <label htmlFor="document-name" className="upload-label block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Nome do documento *
                </label>
                <input
                  id="document-name"
                  type="text"
                  className="upload-input w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 bg-white placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15 transition-all box-border"
                  placeholder="Ex.: Manual de manutenção"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="upload-form-row grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="upload-form-group flex flex-col w-full">
                  <label htmlFor="document-sector" className="upload-label block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Setor responsável *
                  </label>
                  <select
                    id="document-sector"
                    className="upload-select w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 bg-white placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15 transition-all box-border"
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

                <div className="upload-form-group flex flex-col w-full">
                  <label htmlFor="document-level" className="upload-label block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Nível de acesso *
                  </label>
                  <select
                    id="document-level"
                    className="upload-select w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 bg-white placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15 transition-all box-border"
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
                <div className="upload-error-alert flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3.5 py-2.5 text-[13px]" role="alert">
                  <FiAlertCircle size={18} className="upload-error-icon shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="upload-modal-footer flex items-center justify-end gap-3 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  className="upload-btn-cancel px-4.5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors bg-transparent border-none"
                  onClick={handleClose}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="upload-btn-submit px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-65 disabled:cursor-not-allowed rounded-lg inline-flex items-center gap-2 shadow-[0_1px_3px_rgba(37,99,235,0.3)] cursor-pointer transition-colors border-none"
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
