import { useState } from "react";

function TermsModal({ terms, onAccept, onDecline }) {
  const [checkedTerms, setCheckedTerms] = useState({});
  const [view, setView] = useState("terms");

  const handleCheckboxChange = (termId) => {
    setCheckedTerms((prev) => ({
      ...prev,
      [termId]: !prev[termId],
    }));
  };

  const allRequiredChecked = terms
    .filter((term) => term.required)
    .every((term) => checkedTerms[term.id]);

  const handleAccept = () => {
    if (!allRequiredChecked) return;

    const acceptedIds = terms
      .filter((term) => checkedTerms[term.id])
      .map((term) => term.id);

    onAccept(acceptedIds);
  };

  if (view === "warning") {
    return (
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/45 p-5">
        <div className="flex w-full max-w-[540px] flex-col gap-[18px] rounded-2xl border-2 border-[#c9a5b0] bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.15)]">
          <div className="border-b border-[#d6b8c1] pb-3.5 text-center">
            <h2 className="m-0 text-[22px] font-medium tracking-[-0.01em] text-[#4a1a2c]">
              Aviso sobre Consentimento
            </h2>
          </div>

          <div className="flex flex-col gap-3.5 py-2 text-center text-sm text-slate-700">
            <p className="m-0 leading-relaxed">
              É necessário estar de acordo com os{" "}
              <strong className="font-bold text-slate-900">termos obrigatórios</strong> para utilizar a aplicação.
            </p>
            <p className="m-0 leading-relaxed">
              Você será deslogado e todos os{" "}
              <strong className="font-bold text-slate-900">seus dados serão anonimizados</strong>, você{" "}
              <strong className="font-bold text-slate-900">não poderá logar</strong> novamente, deseja atualizar seu
              consentimento sobre os termos?
            </p>
          </div>

          <div className="flex justify-between gap-3 pt-2.5">
            <button
              type="button"
              className="min-w-[130px] rounded-full border border-slate-400 bg-white px-7 py-2 text-sm font-medium text-slate-900 transition-all duration-150 ease-in-out hover:border-slate-500 hover:bg-slate-50"
              onClick={() => setView("terms")}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="min-w-[130px] rounded-full border border-[#7A0026] bg-[#7A0026] px-7 py-2 text-sm font-semibold text-white transition-all duration-150 ease-in-out hover:border-[#5e001d] hover:bg-[#5e001d]"
              onClick={onDecline}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/45 p-5">
      <div className="flex w-full max-w-[540px] flex-col gap-[18px] rounded-2xl border-2 border-[#c9a5b0] bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.15)]">
        <div className="border-b border-[#d6b8c1] pb-3.5 text-center">
          <h2 className="m-0 text-[22px] font-medium tracking-[-0.01em] text-[#4a1a2c]">
            Termos e Condições - IAzimuth
          </h2>
        </div>

        <div className="flex flex-col gap-3.5">
          {terms.map((term) => (
            <div key={term.id} className="flex flex-col gap-1">
              <label className="flex cursor-pointer items-center justify-between rounded border border-[#a5b0c9] bg-white px-3.5 py-2.5 transition-colors duration-150 ease-in-out hover:bg-slate-50">
                <span className="text-sm text-slate-700">{term.description}</span>
                <input
                  type="checkbox"
                  className="ml-3 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-sm accent-[#7A0026] outline outline-1 outline-offset-1 outline-[#a5b0c9]"
                  checked={!!checkedTerms[term.id]}
                  onChange={() => handleCheckboxChange(term.id)}
                />
              </label>
              {term.required && !checkedTerms[term.id] && (
                <span className="pl-0.5 text-xs font-normal text-red-700">
                  *Este termo é obrigatório para utilizar a aplicação
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between gap-3 pt-2.5">
          <button
            type="button"
            className="min-w-[130px] rounded-full border border-slate-400 bg-white px-7 py-2 text-sm font-medium text-slate-900 transition-all duration-150 ease-in-out hover:border-slate-500 hover:bg-slate-50"
            onClick={() => setView("warning")}
          >
            Recusar
          </button>
          <button
            type="button"
            className="min-w-[130px] rounded-full border border-[#7A0026] bg-[#7A0026] px-7 py-2 text-sm font-semibold text-white transition-all duration-150 ease-in-out hover:border-[#5e001d] hover:bg-[#5e001d] disabled:cursor-not-allowed disabled:border-[#c9a5b0] disabled:bg-[#c9a5b0] disabled:opacity-70"
            onClick={handleAccept}
            disabled={!allRequiredChecked}
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsModal;