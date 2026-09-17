import { FiFileText, FiFilter, FiAlertCircle } from "react-icons/fi";
import { useEffect, useState } from "react";

import SearchBar from "../../components/SearchBar/SearchBar";
import DocumentList from "../../components/Document/DocumentList/DocumentList";
import Pagination from "../../components/Pagination/Pagination";
import DocumentModal from "../../components/Document/DocumentModal/DocumentModal";

import { fetchDocuments } from "../../services/documentService";

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
          <FiFileText size={30} />
          <h1>Documentos</h1>
        </div>

        <div className="header-actions">
          <SearchBar value={search} onChange={handleSearch} />
          <button className="filter-button">
            <FiFilter size={15} />
            Filtros
          </button>
        </div>
      </header>

      <section className="documents-section">
        {loading && (
          <p className="loading-message">Carregando documentos...</p>
        )}

        {error && (
          <div className="error-message">
            <FiAlertCircle size={22} />
            <div className="error-text">
              <span className="error-title">Erro ao carregar</span>
              <span className="error-description">{error}</span>
            </div>
          </div>
        )}

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