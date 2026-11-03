import { useState } from "react";
import "./TermsModal.css";

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
      <div className="terms-modal-backdrop">
        <div className="terms-modal-card">
          <div className="terms-header">
            <h2 className="terms-title">Aviso sobre Consentimento</h2>
          </div>

          <div className="terms-warning-body">
            <p>
              É necessário estar de acordo com os{" "}
              <strong>termos obrigatórios</strong> para utilizar a aplicação.
            </p>
            <p>
              Você será deslogado e todos os{" "}
              <strong>seus dados serão anonimizados</strong>, você{" "}
              <strong>não poderá logar</strong> novamente, deseja atualizar seu
              consentimento sobre os termos?
            </p>
          </div>

          <div className="terms-footer">
            <button
              type="button"
              className="btn-recusar"
              onClick={() => setView("terms")}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-aceitar"
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
    <div className="terms-modal-backdrop">
      <div className="terms-modal-card">
        <div className="terms-header">
          <h2 className="terms-title">Termos e Condições - IAzimuth</h2>
        </div>

        <div className="terms-body">
          {terms.map((term) => (
            <div key={term.id} className="term-item">
              <label className="term-label">
                <span className="term-description">{term.description}</span>
                <input
                  type="checkbox"
                  className="term-checkbox"
                  checked={!!checkedTerms[term.id]}
                  onChange={() => handleCheckboxChange(term.id)}
                />
              </label>
              {term.required && !checkedTerms[term.id] && (
                <span className="term-error">
                  *Este termo é obrigatório para utilizar a aplicação
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="terms-footer">
          <button
            type="button"
            className="btn-recusar"
            onClick={() => setView("warning")}
          >
            Recusar
          </button>
          <button
            type="button"
            className="btn-aceitar"
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