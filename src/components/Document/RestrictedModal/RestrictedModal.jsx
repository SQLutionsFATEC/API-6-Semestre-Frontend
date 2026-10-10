import { useEffect } from "react";
import { FiX } from "react-icons/fi";

function RestrictedModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-[2px]"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="restricted-modal-title"
    >
      <div className="relative w-full max-w-[540px] bg-[#fff1f2] border-[1.5px] border-[#fecdd3] rounded-2xl p-8 sm:p-10 text-center shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]">
        <button
          className="absolute top-3.5 right-3.5 flex items-center justify-center w-8 h-8 rounded-lg text-[#881337] hover:bg-[#881337]/10 hover:text-[#4c0519] transition-colors cursor-pointer"
          onClick={onClose}
          aria-label="Fechar"
        >
          <FiX size={18} aria-hidden="true" />
        </button>

        <h2
          id="restricted-modal-title"
          className="m-0 mb-4 text-2xl sm:text-[26px] font-bold text-[#4c0519] tracking-tight leading-tight"
        >
          Acesso Restrito
        </h2>

        <p className="m-0 text-sm sm:text-[15px] font-normal leading-relaxed text-[#5c1d2e]">
          Você não possui nível ou setor adequado para visualizar este arquivo. É necessário enviar uma requisição ao Operador.
        </p>
      </div>
    </div>
  );
}

export default RestrictedModal;
