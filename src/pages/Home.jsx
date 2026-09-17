import { useEffect, useState } from "react";

import SearchBar from "../components/SearchBar/SearchBar";
import DocumentList from "../components/Document/DocumentList";
import Pagination from "../components/Pagination/Pagination";
import DocumentModal from "../components/Document/DocumentModal";

import { fetchDocuments } from "../services/documentService";

import "./Home.css";

function Home() {
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchDocuments({
          nome: search,
          page: currentPage,
        });
        console.log(data);

        setDocuments(data.results || []);
        setTotalPages(data.pages || 1);
      } catch (err) {
        console.error("Erro ao buscar documentos:", err);
        setError("Não foi possível carregar os documentos.");
        setDocuments([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, 400); 

    return () => clearTimeout(timer);
  }, [search, currentPage]);

  function handleSearch(value) {
    setSearch(value);
    setCurrentPage(1); 
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  function handleViewPdf(document) {
    if (document.pdfUrl) {
      window.open(document.pdfUrl, "_blank");
      return;
    }
    console.log("PDF ainda não disponível:", document.nome);
  }

  return (
    <div className="home">
      <header className="page-header">
        <div className="page-title">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M7 3H15L19 7V21H7V3Z" stroke="currentColor" strokeWidth="1.7" />
            <path d="M15 3V7H19" stroke="currentColor" strokeWidth="1.7" />
            <path d="M4 7V19C4 20.1 4.9 21 6 21" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          <h1>Documentos</h1>
        </div>

        <div className="header-actions">
          <SearchBar value={search} onChange={handleSearch} />
          <button className="filter-button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 6H20L14 13V19L10 21V13L4 6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
            Filtros
          </button>
        </div>
      </header>

      <section className="documents-section">
        {loading && <p>Carregando documentos...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <>
            <DocumentList
              documents={documents}
              onView={setSelectedDocument}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>

      <DocumentModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onViewPdf={handleViewPdf}
      />
    </div>
  );
}

export default Home;