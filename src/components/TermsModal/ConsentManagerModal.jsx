import { useEffect, useState } from "react";
import { FiEdit2, FiLoader } from "react-icons/fi";

function ConsentManagerModal({ terms = [], acceptedTermIds = [], onSave, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(() =>
    Object.fromEntries(acceptedTermIds.map((termId) => [termId, true]))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const requiredTermsChecked = terms
    .filter((term) => term.required)
    .every((term) => checkedTerms[term.id]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  function handleCheckboxChange(termId) {
    setCheckedTerms((previous) => ({
      ...previous,
      [termId]: !previous[termId],
    }));
  }

  function handleStartEditing() {
    setSaveError("");
    setIsEditing(true);
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget && !isSaving) {
      onClose();
    }
  }

  async function handleSave() {
    if (isSaving || !requiredTermsChecked) return;

    const acceptedIds = terms
      .filter((term) => checkedTerms[term.id])
      .map((term) => term.id);

    setIsSaving(true);
    setSaveError("");

    try {
      await onSave(acceptedIds);
    } catch (error) {
      console.error("Erro ao salvar os consentimentos:", error);
      setSaveError(
        "Não foi possível salvar suas alterações. Tente novamente mais tarde."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/45 p-5"
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-manager-title"
        className="flex min-h-[320px] w-full max-w-[560px] flex-col gap-[18px] rounded-2xl border-2 border-[#c9a5b0] bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.15)]"
      >
        <div className="border-b border-[#d6b8c1] pb-3.5 text-center">
          <h2
            id="consent-manager-title"
            className="m-0 text-[22px] font-medium tracking-[-0.01em] text-[#4a1a2c]"
          >
            Termos e Condições
          </h2>
        </div>

        <div className="flex flex-1 flex-col gap-3.5">
          {terms.length === 0 && (
            <p className="m-0 py-6 text-center text-sm text-slate-500">
              Nenhum termo cadastrado.
            </p>
          )}

          {terms.map((term) => {
            const checkboxId = `consent-term-${term.id}`;
            const isChecked = Boolean(checkedTerms[term.id]);

            return (
              <div key={term.id} className="flex flex-col gap-1">
                <label
                  htmlFor={checkboxId}
                  className={`flex items-center justify-between gap-3 rounded border border-[#a5b0c9] bg-white px-3.5 py-2.5 transition-colors duration-150 ease-in-out ${
                    isEditing && !isSaving
                      ? "cursor-pointer hover:bg-slate-50"
                      : "cursor-default"
                  }`}
                >
                  <span className="text-sm text-slate-700">
                    {term.description}
                  </span>
                  <input
                    id={checkboxId}
                    type="checkbox"
                    className="h-[18px] w-[18px] shrink-0 cursor-pointer rounded-sm accent-[#7A0026] outline outline-1 outline-offset-1 outline-[#a5b0c9] disabled:cursor-default"
                    checked={isChecked}
                    disabled={!isEditing || isSaving}
                    onChange={() => handleCheckboxChange(term.id)}
                  />
                </label>

                {isEditing && term.required && !isChecked && (
                  <span className="pl-0.5 text-xs font-normal text-red-700">
                    *Este termo é obrigatório para utilizar a aplicação
                  </span>
                )}
              </div>
            );
          })}

          {saveError && (
            <p
              role="alert"
              className="m-0 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#991b1b]"
            >
              {saveError}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2.5">
          {isEditing ? (
            <>
              <button
                type="button"
                className="min-w-[130px] cursor-pointer rounded-full border border-slate-400 bg-white px-7 py-2 text-sm font-medium text-slate-900 transition-all duration-150 ease-in-out hover:border-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="flex min-w-[170px] cursor-pointer items-center justify-center gap-2 rounded-full border border-[#7A0026] bg-[#7A0026] px-6 py-2 text-sm font-semibold text-white transition-all duration-150 ease-in-out hover:border-[#5e001d] hover:bg-[#5e001d] disabled:cursor-not-allowed disabled:border-[#c9a5b0] disabled:bg-[#c9a5b0] disabled:opacity-70"
                onClick={handleSave}
                disabled={!requiredTermsChecked || isSaving}
              >
                {isSaving ? (
                  <FiLoader className="animate-spin" size={14} aria-hidden="true" />
                ) : (
                  <FiEdit2 size={14} aria-hidden="true" />
                )}
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="ml-auto flex cursor-pointer items-center gap-2 rounded-full border border-[#a5b0c9] bg-white px-5 py-2 text-sm font-medium text-[#1b4066] transition-all duration-150 ease-in-out hover:border-[#7A0026] hover:bg-slate-50 hover:text-[#7A0026]"
              onClick={handleStartEditing}
            >
              <FiEdit2 size={14} aria-hidden="true" />
              Gerenciar Consentimentos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConsentManagerModal;
