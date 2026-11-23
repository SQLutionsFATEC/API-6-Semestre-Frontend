import { FiAlertCircle, FiFileText, FiFilter } from "react-icons/fi";
import { useCallback, useEffect, useRef, useState } from "react";

import AlertModal from "../../components/AlertModal/AlertModal";
import DocumentList from "../../components/Document/DocumentList/DocumentList";
import DocumentModal from "../../components/Document/DocumentModal/DocumentModal";
import EditDocumentModal from "../../components/Document/EditDocumentModal/EditDocumentModal";
import PdfViewer from "../../components/Document/PdfViewer/PdfViewer";
import RestrictedModal from "../../components/Document/RestrictedModal/RestrictedModal";
import FilterSidebar from "../../components/FilterSidebar/FilterSidebar";
import Pagination from "../../components/Pagination/Pagination";
import SearchBar from "../../components/SearchBar/SearchBar";
import UserModal from "../../components/UserModal/UserModal";
import UploadModal from "../../components/Document/UploadModal/UploadModal";
import TermsModal from "../../components/TermsModal/TermsModal";
import ConsentManagerModal from "../../components/TermsModal/ConsentManagerModal";
import LeakWarning from "../../components/LeakWarning/LeakWarning";
import UserMenu from "../../components/UserMenu/UserMenu";

import {
  fetchDocumentById,
  fetchDocuments,
} from "../../services/documentService";
import { requestDocumentAccess } from "../../services/accessRequestService";
import { clearLocalSession } from "../../services/keycloak";
import { deleteOwnAccount, fetchUserProfile } from "../../services/userService";
import {
  fetchTerms,
  fetchUserConsents,
  acceptTerms,
  updateUserConsents,
} from "../../services/termsService";
import {
  acknowledgeLeakIncident,
  fetchLatestLeakIncident,
  isLeakIncidentAcknowledged,
} from "../../services/leakWarningService";

import "./Home.css";
import { keycloak } from "../../services/keycloak";

const EMPTY_FILTERS = {
  tags: [],
  tipo: [],
  data_atualizacao: "",
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
  const [documentDetailsLoading, setDocumentDetailsLoading] =
    useState(false);
  const [documentDetailsError, setDocumentDetailsError] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPermissionError, setEditPermissionError] = useState("");
  const [requestAccessLoading, setRequestAccessLoading] = useState(false);
  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false);
  const [pdfViewerDocument, setPdfViewerDocument] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: "Carregando...",
    email: "",
    role: "—",
    level: "—",
  });
  const [userDeletionFeedback, setUserDeletionFeedback] = useState(null);
  
  const [terms, setTerms] = useState([]);
  const [consents, setConsents] = useState([]);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isConsentManagerOpen, setIsConsentManagerOpen] = useState(false);
  const [isLeakWarningOpen, setIsLeakWarningOpen] = useState(false);
  const [leakIncident, setLeakIncident] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const detailRequestId = useRef(0);

  const handleCloseFilters = useCallback(() => {
    setIsFilterSidebarOpen(false);
  }, []);

  const handleClosePdfViewer = useCallback(() => {
    setPdfViewerDocument(null);
  }, []);

  const currentUserId = keycloak?.subject ?? keycloak?.tokenParsed?.sub ?? "";

  useEffect(() => {
    function handleTermsRequired() {
      setIsTermsModalOpen(true);
    }

    window.addEventListener("terms-required", handleTermsRequired);
    return () => window.removeEventListener("terms-required", handleTermsRequired);
  }, []);

  const checkLeakWarning = useCallback(async () => {
    try {
      const incident = await fetchLatestLeakIncident();

      if (!incident?.id) return;
      if (isLeakIncidentAcknowledged(incident.id, currentUserId)) return;

      setLeakIncident(incident);
      setIsLeakWarningOpen(true);
    } catch (err) {
      console.error("Erro ao verificar incidentes de vazamento:", err);
    }
  }, [currentUserId]);

  useEffect(() => {
    async function loadUserAndTerms() {
      try {
        const userData = await fetchUserProfile();
        setCurrentUser({
          name: userData.nome,
          email: userData.email,
          role: userData.setor,
          level: userData.nivel_acesso,
        });
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        setCurrentUser({ name: "Usuário", email: "—", role: "—", level: "—" });
      }

      try {
        const fetchedTerms = await fetchTerms();
        const userConsents = await fetchUserConsents();

        setTerms(fetchedTerms);
        setConsents(userConsents);

        const hasPendingRequiredTerm = fetchedTerms.some(
          (term) => term.required && !userConsents.includes(term.id)
        );

        if (hasPendingRequiredTerm) {
          setIsTermsModalOpen(true);
        } else {
          await checkLeakWarning();
        }
      } catch (err) {
        console.error("Erro ao carregar os termos e consentimentos:", err);
      }
    }

    loadUserAndTerms().catch((err) => {
      console.error("Erro inesperado:", err);
    });
  }, [checkLeakWarning]);

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

  function handleCloseDocumentModal() {
    detailRequestId.current += 1;

    setSelectedDocument(null);
    setDocumentDetailsLoading(false);
    setDocumentDetailsError(null);
    setIsEditModalOpen(false);
  }

  function handleViewPdf(document) {
    if (document?.acesso_permitido === false) {
      setPdfViewerDocument(null);
      handleCloseDocumentModal();
      setRestrictedModalOpen(true);
      return;
    }

    if (document?.data) {
      setPdfViewerDocument(document);
      return;
    }

    console.log(
      "PDF ainda não disponível:",
      document?.nome ?? "Documento sem título"
    );
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
    setEditPermissionError("");
    detailRequestId.current += 1;

    setIsEditModalOpen(false);
    setSelectedDocument(document);
    setDocumentDetailsLoading(false);
    setDocumentDetailsError(null);

    void loadDocumentDetails(document.id_documento, document);
  }

  function handleRetryDocumentDetails() {
    if (selectedDocument?.id_documento) {
      void loadDocumentDetails(
        selectedDocument.id_documento,
        selectedDocument
      );
    }
  }

  async function handleRequestAccess(document) {
    const idDocumento = document?.id_documento ?? document?.id;

    if (idDocumento === undefined || idDocumento === null) {
      window.alert("Não foi possível enviar a solicitação de acesso. Tente novamente.");
      return;
    }

    setRequestAccessLoading(true);

    try {
      const { created } = await requestDocumentAccess(idDocumento);

      window.alert(
        created
          ? "Solicitação de acesso enviada com sucesso."
          : "Você já possui uma solicitação de acesso para este documento."
      );
    } catch (err) {
      console.error("Erro ao solicitar acesso ao documento:", err);
      window.alert(
        "Não foi possível enviar a solicitação de acesso. Tente novamente."
      );
    } finally {
      setRequestAccessLoading(false);
    }
  }

  function handleEditDocument(document) {
    if (document?.acesso_permitido === false) return;

    const isOperator =
      keycloak.hasRealmRole("operador") ||
      keycloak.tokenParsed?.realm_access?.roles?.includes("operador");
    if (!isOperator) {
      setEditPermissionError(
        "Somente usuários com a role Operador podem editar documentos. Solicite a um operador que faça a alteração."
      );
      return;
    }

    setEditPermissionError("");
    setIsEditModalOpen(true);
  }

  function handleBackToDetails() {
    setIsEditModalOpen(false);
  }

  function handleDocumentUpdated(updatedDocument) {
    setSelectedDocument((current) => {
      if (!current) return updatedDocument;

      return {
        ...current,
        ...updatedDocument,
      };
    });

    setDocuments((currentDocuments) =>
      currentDocuments.map((item) =>
        item.id_documento === updatedDocument.id_documento
          ? { ...item, ...updatedDocument }
          : item
      )
    );

    setIsEditModalOpen(false);
    void loadDocumentDetails(updatedDocument.id_documento, updatedDocument);
  }

  function handleUserUpdated(updatedUser) {
    setCurrentUser((prev) => ({
      ...prev,
      ...updatedUser,
    }));
  }

  async function handleUserDeleted() {
    try {
      await deleteOwnAccount();
    } catch (err) {
      console.error("Erro ao excluir a conta:", err);

      setUserDeletionFeedback({
        type: "error",
        title: "Não foi possível excluir sua conta",
        message:
          typeof err?.response?.data?.detail === "string"
            ? err.response.data.detail
            : "Tente novamente mais tarde.",
      });

            // Mantém a confirmação aberta para que o usuário possa tentar de novo.      
      throw err;
    }

    setUserDeletionFeedback({
      type: "success",
      title: "Conta excluída com sucesso",
      message:
        "Seus dados foram removidos e sua sessão local será encerrada.",
    });
  }

  function handleCloseUserDeletionFeedback() {
    const feedback = userDeletionFeedback;

    setUserDeletionFeedback(null);

        // Só encerra a sessão depois que o usuário viu o retorno da exclusão.    
    if (feedback?.type === "success") {
      clearLocalSession();
    }
  }

  async function handleAcceptTerms(acceptedTermIds) {
    await acceptTerms(acceptedTermIds, terms);
    setConsents(acceptedTermIds);
    setIsTermsModalOpen(false);
    await checkLeakWarning();
  }

  async function handleSaveConsents(acceptedTermIds) {
    await updateUserConsents(acceptedTermIds, terms);
    setConsents(acceptedTermIds);
    setIsConsentManagerOpen(false);
  }

  function handleCloseLeakWarning() {
    if (leakIncident?.id) {
      acknowledgeLeakIncident(leakIncident.id, currentUserId);
    }

    setLeakIncident(null);
    setIsLeakWarningOpen(false);
  }

  async function handleDeclineTerms() {
    await deleteOwnAccount();
    setIsTermsModalOpen(false);
    clearLocalSession();
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
            className={`filter-button${
              activeFiltersCount > 0 ? " filter-button-active" : ""
            }`}
            aria-haspopup="dialog"
            aria-expanded={isFilterSidebarOpen}
            aria-label={
              activeFiltersCount > 0
                ? `Filtros: ${activeFiltersCount} ativo${
                    activeFiltersCount > 1 ? "s" : ""
                  }`
                : "Filtros"
            }
            onClick={() => setIsFilterSidebarOpen(true)}
          >
            <FiFilter size={15} aria-hidden="true" />
            Filtros

            {activeFiltersCount > 0 && (
              <span
                className="filter-active-indicator"
                aria-hidden="true"
              >
                {activeFiltersCount}
              </span>
            )}
          </button>

          <UserMenu
            user={currentUser}
            onOpenProfile={() => setIsUserModalOpen(true)}
            onOpenConsent={() => setIsConsentManagerOpen(true)}
          />
        </div>
      </header>

      <section className="documents-section">
        {loading && (
          <p className="loading-message">Carregando documentos...</p>
        )}

        {error && (
          <div className="error-message" role="alert">
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

      {!isEditModalOpen && (
        <DocumentModal
          document={selectedDocument}
          loading={documentDetailsLoading}
          error={documentDetailsError}
          onClose={handleCloseDocumentModal}
          onRetry={handleRetryDocumentDetails}
          onViewPdf={handleViewPdf}
          onEdit={handleEditDocument}
          onRequestAccess={handleRequestAccess}
          requestAccessLoading={requestAccessLoading}
          editPermissionError={editPermissionError}
        />
      )}

      {isEditModalOpen && selectedDocument && (
        <EditDocumentModal
          document={selectedDocument}
          onClose={handleBackToDetails}
          onBackToDetails={handleBackToDetails}
          onDocumentUpdated={handleDocumentUpdated}
        />
      )}

      <RestrictedModal
        isOpen={restrictedModalOpen}
        onClose={() => setRestrictedModalOpen(false)}
      />

      <PdfViewer
        key={pdfViewerDocument?.data || "closed"}
        document={pdfViewerDocument}
        onClose={handleClosePdfViewer}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={currentUser}
        onUserUpdated={handleUserUpdated}
        onUserDeleted={handleUserDeleted}
      />

      <AlertModal
        isOpen={Boolean(userDeletionFeedback)}
        type={userDeletionFeedback?.type}
        title={userDeletionFeedback?.title}
        message={userDeletionFeedback?.message}
        onClose={handleCloseUserDeletionFeedback}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentCreated={() => {
          setRefreshKey((prev) => prev + 1);
        }}
        onViewDocument={(documentoCriado) => {
          setIsUploadModalOpen(false);
          handleOpenDocument(documentoCriado);
        }}
      />

      {/* Modal de Termos e Condições */}
      {isTermsModalOpen && terms.length > 0 && (
        <TermsModal
          terms={terms}
          acceptedTermIds={consents}
          onAccept={handleAcceptTerms}
          onDecline={handleDeclineTerms}
        />
      )}

      {isConsentManagerOpen && terms.length > 0 && (
        <ConsentManagerModal
          terms={terms}
          acceptedTermIds={consents}
          onSave={handleSaveConsents}
          onClose={() => setIsConsentManagerOpen(false)}
        />
      )}

      {/* Modal de Aviso de Vazamento (Aparece após o de Termos) */}
      {isLeakWarningOpen && (
        <LeakWarning onClose={handleCloseLeakWarning} />
      )}
    </div>
  );
}

export default Home;