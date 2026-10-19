import { FiAlertCircle, FiFileText, FiFilter, FiUser } from "react-icons/fi";
import { useCallback, useEffect, useRef, useState } from "react";

import DocumentList from "../../components/Document/DocumentList/DocumentList";
import DocumentModal from "../../components/Document/DocumentModal/DocumentModal";
import PdfViewer from "../../components/Document/PdfViewer/PdfViewer";
import RestrictedModal from "../../components/Document/RestrictedModal/RestrictedModal";
import FilterSidebar from "../../components/FilterSidebar/FilterSidebar";
import Pagination from "../../components/Pagination/Pagination";
import SearchBar from "../../components/SearchBar/SearchBar";
import UserModal from "../../components/UserModal/UserModal";
import UploadModal from "../../components/Document/UploadModal/UploadModal";

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

const MOCK_CURRENT_USER = {
  name: "Chico Soluções",
  email: "ChicoLutions@gmail.com",
  role: "Técnico",
  level: "Nível 1",
};

function Home({ documentsRefreshKey = 0 }) {
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState("nome");
  const [documents, setDocuments] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const activeFiltersCount =
    filters.tags.length +
    filters.tipo.length +
    (filters.data_atualizacao ? 1 : 0);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewerDocument, setViewerDocument] = useState(null);
  const [documentDetailsLoading, setDocumentDetailsLoading] = useState(false);
  const [documentDetailsError, setDocumentDetailsError] = useState(null);
  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(MOCK_CURRENT_USER);
  const [refreshKey, setRefreshKey] = useState(0);
  const detailRequestId = useRef(0);

  const handleCloseFilters = useCallback(() => {
    setIsFilterSidebarOpen(false);
  }, []);

  const handleClosePdfViewer = useCallback(() => {
    setViewerDocument(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = {
          nome: "",
          contexto: "",
          page: currentPage,
          tags: filters.tags,
          tipo: filters.tipo,
          data_atualizacao: filters.data_atualizacao,
        };

        const trimmedSearch = search.trim();
        if (trimmedSearch !== "") {
          if (searchMode === "nome") {
            queryParams.nome = trimmedSearch;
          } else if (searchMode === "tags") {
            queryParams.etiquetas = trimmedSearch;
          } else if (searchMode === "conteudo") {
            queryParams.contexto = trimmedSearch;
          }
        }

        const data = await fetchDocuments(queryParams);

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
    searchMode,
    currentPage,
    filters.tags,
    filters.tipo,
    filters.data_atualizacao,
    documentsRefreshKey,
    refreshKey,
  ]);

  function handleSearch(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleSearchModeChange(mode) {
    setSearchMode(mode);
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
  }

  function handleViewPdf(document) {
    if (document.acesso_permitido === false) {
      setRestrictedModalOpen(true);
      return;
    }

    if (document.data) {
      setViewerDocument(document);
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
  function handleUserUpdated(updatedUser) {
    setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
  }

  function handleUserDeleted() {
    console.log("Conta excluída (simulação).");
    setCurrentUser(MOCK_CURRENT_USER);
  }

  return (
    <div className="home">
      <header className="page-header">
        <div className="page-title">
          <FiFileText size={30} />
          <h1>Documentos</h1>
        </div>

        <div className="header-actions">
          <SearchBar
            value={search}
            onChange={handleSearch}
            searchMode={searchMode}
            onModeChange={handleSearchModeChange}
          />

          <button
            type="button"
            className={`filter-button${activeFiltersCount > 0 ? " filter-button-active" : ""}`}
            aria-haspopup="dialog"
            aria-expanded={isFilterSidebarOpen}
            aria-label={
              activeFiltersCount > 0
                ? `Filtros: ${activeFiltersCount} ativo${activeFiltersCount > 1 ? "s" : ""}`
                : "Filtros"
            }
            onClick={() => setIsFilterSidebarOpen(true)}
          >
            <FiFilter size={15} aria-hidden="true" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="filter-active-indicator" aria-hidden="true">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="user-trigger"
            onClick={() => setIsUserModalOpen(true)}
            aria-label="Abrir perfil do usuário"
          >
            <FiUser size={18} />
            <span>{currentUser.name}</span>
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
        onClearFilters={handleClearFilters}
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

      <PdfViewer
        key={viewerDocument?.data || "closed"}
        document={viewerDocument}
        onClose={handleClosePdfViewer}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={currentUser}
        onUserUpdated={handleUserUpdated}
        onUserDeleted={handleUserDeleted}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentCreated={() => {
          setRefreshKey(prev => prev + 1);
        }}
        onViewDocument={(documentoCriado) => {
          setIsUploadModalOpen(false);
          handleOpenDocument(documentoCriado);
        }}
      />
    </div>
  );
}

export default Home;