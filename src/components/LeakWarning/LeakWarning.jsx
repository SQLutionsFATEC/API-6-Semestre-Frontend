import { FiX } from "react-icons/fi";

function LeakWarning({ onClose }) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-start justify-center bg-slate-900/45 p-5 pt-24">
      {/* Card do modal */}
      <div className="relative w-full max-w-[600px] rounded-2xl border-2 border-[#d6b8c1] bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.15)]">
        
        {/* Botão de Fechar (X) */}
        <button
          type="button"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          onClick={onClose}
          aria-label="Fechar aviso"
        >
          <FiX size={20} />
        </button>

        {/* Título */}
        <div className="mb-4 text-center">
          <h2 className="text-[22px] font-medium tracking-[-0.01em] text-[#4a1a2c]">
            Aviso de vazamento de Dados
          </h2>
        </div>

        {/* Linha divisória e Texto */}
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm text-slate-700">
            Identificamos um incidente de segurança recente.
          </p>
          <p className="text-sm font-semibold text-slate-800">
            Medidas de proteção foram aplicadas preventivamente aos dados afetados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LeakWarning;