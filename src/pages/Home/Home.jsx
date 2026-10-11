import { FiAlertCircle, FiFileText, FiFilter } from "react-icons/fi";
import { useCallback, useEffect, useRef, useState } from "react";

import SearchBar from "../../components/SearchBar/SearchBar";
import FilterSidebar from "../../components/FilterSidebar/FilterSidebar";
import DocumentList from "../../components/Document/DocumentList/DocumentList";
import Pagination from "../../components/Pagination/Pagination";
import DocumentModal from "../../components/Document/DocumentModal/DocumentModal";
import RestrictedModal from "../../components/Document/RestrictedModal/RestrictedModal";

import {
  fetchDocumentById,
  fetchDocuments,
} from "../../services/documentService";

import "./Home.css";

const EMPTY_FILTERS = {
  tags: [],
  tipo: [],
  data_atualizacao: "",
};

function Home() {
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentDetailsLoading, setDocumentDetailsLoading] = useState(false);
  const [documentDetailsError, setDocumentDetailsError] = useState(null);
  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false);
  const detailRequestId = useRef(0);

  const handleCloseFilters = useCallback(() => {
    setIsFilterSidebarOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchDocuments({
          nome: search,
          contexto: search,
          page: currentPage,
          tags: filters.tags,
          tipo: filters.tipo,
          data_atualizacao: filters.data_atualizacao,
        });

        if (cancelled) return;

        setDocuments(data.results || []);
        setTotalPages(data.pages || 1);
      } catch (err) {
        if (cancelled) return;

        console.error("Erro ao buscar documentos:", err);
        setError("Não foi possível carregar os documentos.");
        setDocuments([]);
        setTotalPages(1);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    search,
    currentPage,
    filters.tags,
    filters.tipo,
    filters.data_atualizacao,
  ]);

  function handleSearch(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  function handleApplyFilters(nextFilters) {
    setFilters({
      tags: [...(nextFilters.tags || [])],
      tipo: [...(nextFilters.tipo || [])],
      data_atualizacao: nextFilters.data_atualizacao || "",
    });
    setCurrentPage(1);
    setIsFilterSidebarOpen(false);
  }

  function handleClearFilters() {
    setFilters({
      tags: [],
      tipo: [],
      data_atualizacao: "",
    });
    setCurrentPage(1);
    setIsFilterSidebarOpen(false);
  }

  function handleViewPdf(document) {
    if (document.acesso_permitido === false) {
      setRestrictedModalOpen(true);
      return;
    }

    if (document.data) {
      window.open(document.data, "_blank");
      return;
    }

    console.log("PDF ainda não disponível:", document.nome);
  }

  async function loadDocumentDetails(idDocumento, initialDocument) {
    const requestId = ++detailRequestId.current;

    setDocumentDetailsLoading(true);
    setDocumentDetailsError(null);

    try {
      const document = await fetchDocumentById(idDocumento);

      if (requestId === detailRequestId.current) {
        setSelectedDocument({
          ...initialDocument,
          ...document,
          acesso_permitido:
            typeof document.acesso_permitido === "boolean"
              ? document.acesso_permitido
              : initialDocument?.acesso_permitido,
        });
      }
    } catch (err) {
      if (requestId === detailRequestId.current) {
        console.error("Erro ao buscar detalhes do documento:", err);
        setDocumentDetailsError(
          "Não foi possível carregar os detalhes do documento."
        );
      }
    } finally {
      if (requestId === detailRequestId.current) {
        setDocumentDetailsLoading(false);
      }
    }
  }

  function handleOpenDocument(document) {
    setSelectedDocument(document);
    loadDocumentDetails(document.id_documento, document);
  }

  function handleCloseDocumentModal() {
    detailRequestId.current += 1;
    setSelectedDocument(null);
    setDocumentDetailsLoading(false);
    setDocumentDetailsError(null);
  }

  function handleRetryDocumentDetails() {
    if (selectedDocument?.id_documento) {
      loadDocumentDetails(
        selectedDocument.id_documento,
        selectedDocument
      );
    }
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

          <button
            type="button"
            className="filter-button"
            aria-haspopup="dialog"
            aria-expanded={isFilterSidebarOpen}
            onClick={() => setIsFilterSidebarOpen(true)}
          >
            <FiFilter size={15} aria-hidden="true" />
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
              onView={handleViewPdf}
              onOpenDetails={handleOpenDocument}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>

      <FilterSidebar
        isOpen={isFilterSidebarOpen}
        filters={filters}
        onClose={handleCloseFilters}
        onApplyFilters={handleApplyFilters}
      />

      <DocumentModal
        document={selectedDocument}
        loading={documentDetailsLoading}
        error={documentDetailsError}
        onClose={handleCloseDocumentModal}
        onRetry={handleRetryDocumentDetails}
        onViewPdf={handleViewPdf}
      />

      <RestrictedModal
        isOpen={restrictedModalOpen}
        onClose={() => setRestrictedModalOpen(false)}
      />
    </div>
  );
}

export default Home;