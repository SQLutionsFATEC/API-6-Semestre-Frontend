import { useMemo, useState } from "react";

import SearchBar from "./components/SearchBar";
import DocumentList from "./components/DocumentList";
import Pagination from "./components/Pagination";

import documents from "./data/documents";

import logo from "./assets/AkaerLogo.png";

import "./App.css";

const DOCUMENTS_PER_PAGE = 10;

function App() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) =>
      document.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search]);

  const totalPages = Math.ceil(
    filteredDocuments.length / DOCUMENTS_PER_PAGE
  );

  const validPage =
    totalPages === 0
      ? 1
      : Math.min(currentPage, totalPages);

  const firstDocumentIndex =
    (validPage - 1) * DOCUMENTS_PER_PAGE;

  const currentDocuments = filteredDocuments.slice(
    firstDocumentIndex,
    firstDocumentIndex + DOCUMENTS_PER_PAGE
  );

  function handleSearch(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">
            <img src={logo} alt="Akaer Logo" />
          </div>
        </div>

        <nav className="sidebar-menu">
          <button className="sidebar-item active">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 3H14L19 8V21H6V3Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M14 3V8H19"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>

            Documentos
          </button>
        </nav>

        <button className="logout-button">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M10 5H5V19H10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M14 8L19 12L14 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M19 12H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          Deslogar
        </button>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <div className="page-title">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M7 3H15L19 7V21H7V3Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />

              <path
                d="M15 3V7H19"
                stroke="currentColor"
                strokeWidth="1.7"
              />

              <path
                d="M4 7V19C4 20.1 4.9 21 6 21"
                stroke="currentColor"
                strokeWidth="1.7"
              />
            </svg>

            <h1>Documentos</h1>
          </div>

          <div className="header-actions">
            <SearchBar
              value={search}
              onChange={handleSearch}
            />

            <button className="filter-button">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M4 6H20L14 13V19L10 21V13L4 6Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>

              Filtros
            </button>
          </div>
        </header>

        <section className="documents-section">
          <DocumentList
            documents={currentDocuments}
            onView={setSelectedDocument}
          />

          <Pagination
            currentPage={validPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </section>
      </main>

      {selectedDocument && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className="document-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedDocument.name}</h2>

              <button
                className="modal-close"
                onClick={() => setSelectedDocument(null)}
              >
                ×
              </button>
            </div>

            <div className="pdf-preview">
              <div className="pdf-icon">
                PDF
              </div>

              <h3>Visualização do documento</h3>

              <p>
                Esta é uma visualização mockada do documento
                selecionado.
              </p>
            </div>

            <div className="modal-footer">
              <span>
                Tipo: {selectedDocument.type}
              </span>

              <span>
                Atualizado: {selectedDocument.updatedAt}
              </span>

              <span>
                Acesso: {selectedDocument.accessLevel}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;