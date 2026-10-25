import { useEffect } from "react";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";

const ALERT_STYLES = {
  success: {
    icon: FiCheckCircle,
    card: "bg-[#f0fdf4] border-[#bbf7d0]",
    iconWrapper: "bg-[#dcfce7] text-[#15803d]",
    title: "text-[#14532d]",
    message: "text-[#166534]",
    action:
      "bg-[#15803d] text-white hover:bg-[#166534] focus-visible:outline-[#15803d]",
    actionLabel: "Concluir",
  },
  error: {
    icon: FiAlertCircle,
    card: "bg-[#fef2f2] border-[#fecaca]",
    iconWrapper: "bg-[#fee2e2] text-[#b91c1c]",
    title: "text-[#7f1d1d]",
    message: "text-[#991b1b]",
    action:
      "bg-[#7A0026] text-white hover:bg-[#5e001d] focus-visible:outline-[#7A0026]",
    actionLabel: "Entendi",
  },
};

function AlertModal({ isOpen, type = "success", title, message, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const styles = ALERT_STYLES[type] ?? ALERT_STYLES.success;
  const Icon = styles.icon;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-[2px]"
      onClick={handleOverlayClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      aria-describedby="alert-modal-message"
    >
      <div
        className={`relative w-full max-w-[440px] rounded-2xl border-[1.5px] p-8 text-center shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] ${styles.card}`}
      >
        <button
          type="button"
          className="absolute top-3.5 right-3.5 flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-900/10 hover:text-slate-700 transition-colors cursor-pointer"
          onClick={onClose}
          aria-label="Fechar"
        >
          <FiX size={18} aria-hidden="true" />
        </button>

        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${styles.iconWrapper}`}
          aria-hidden="true"
        >
          <Icon size={28} />
        </div>

        <h2
          id="alert-modal-title"
          className={`m-0 mb-2 text-xl font-bold tracking-tight leading-tight ${styles.title}`}
        >
          {title}
        </h2>

        <p
          id="alert-modal-message"
          className={`m-0 mb-6 text-sm font-normal leading-relaxed ${styles.message}`}
        >
          {message}
        </p>

        <button
          type="button"
          className={`w-full px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${styles.action}`}
          onClick={onClose}
        >
          {styles.actionLabel}
        </button>
      </div>
    </div>
  );
}

export default AlertModal;
