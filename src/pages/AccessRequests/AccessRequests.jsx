import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiClipboard,
  FiFile,
  FiSettings,
  FiUser,
  FiX,
} from "react-icons/fi";
import Pagination from "../../components/Pagination/Pagination";
import {
  fetchAccessRequests,
  resolveAccessRequestDetails,
} from "../../services/accessRequestService";

// O endpoint /api/solicitacoes-acesso/ pagina de 10 em 10.
const REQUESTS_PAGE_SIZE = 10;

function formatRequestDate(dateValue) {
  if (dateValue === null || dateValue === undefined || dateValue === "") {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

export default function AccessRequests() {
  const [requests, setRequests] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalPages = Math.max(
    1,
    Math.ceil(requestCount / REQUESTS_PAGE_SIZE)
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchAccessRequests({ page: currentPage });
        const detailedRequests = await resolveAccessRequestDetails(
          data.results
        );

        if (cancelled) return;

        setRequests(detailedRequests);
        setRequestCount(data.count);
      } catch (err) {
        if (cancelled) return;

        console.error("Erro ao buscar solicitações de acesso:", err);
        setError("Não foi possível carregar as solicitações de acesso.");
        setRequests([]);
        setRequestCount(0);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRequests();

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  function showMockAction(action) {
    window.alert(`Ação de ${action} em desenvolvimento.`);
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full flex-col">
      <header className="flex min-h-[52px] items-start justify-between border-b border-[#e8dce1] pb-1">
        <div className="flex items-center gap-3 text-[#7a0026]">
          <FiClipboard size={30} aria-hidden="true" />
          <h1 className="m-0 text-[30px] font-medium tracking-[-0.02em] max-[560px]:text-[23px]">
            Solicitações
          </h1>
        </div>
        <div
          className="flex items-center gap-2 border-b border-[#e8dce1] px-1 pb-2 text-[13px] text-[#333] [&>svg]:text-[#111]"
          aria-label="Usuário atual"
        >
          <FiUser size={22} aria-hidden="true" />
          <span className="max-[560px]:hidden">Nome do usuário</span>
        </div>
      </header>

      <section className="mt-6" aria-label="Solicitações de acesso">
        <div
          className="mb-1 grid grid-cols-[minmax(240px,1fr)_minmax(120px,0.6fr)_minmax(130px,0.55fr)_66px] items-center gap-3 px-3 pl-[46px] text-[10px] text-[#8c6a78] max-[800px]:hidden [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span]:whitespace-nowrap"
          aria-hidden="true"
        >
          <span>Nome do documento</span>
          <span><FiUser size={13} /> Solicitante</span>
          <span><FiCalendar size={13} /> Data da solicitação</span>
          <span><FiSettings size={13} /> Ação</span>
        </div>

        {loading && (
          <p className="px-3 text-sm text-[#4a1028]" role="status">
            Carregando solicitações...
          </p>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 px-3 text-sm text-rose-700" role="alert">
            <FiAlertCircle size={20} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <p className="px-3 text-sm text-[#4a1028]">
            Nenhuma solicitação de acesso encontrada.
          </p>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="flex flex-col gap-[10px]">
            {requests.map((request) => (
              <article
                className="grid min-h-11 grid-cols-[24px_minmax(200px,1fr)_minmax(120px,0.6fr)_minmax(110px,0.55fr)_54px] items-center gap-3 rounded-[9px] border border-[#aebbd0] bg-white px-3 py-1.5 shadow-[0_2px_5px_rgba(15,23,42,0.09)] max-[800px]:grid-cols-[24px_minmax(0,1fr)_auto] max-[800px]:gap-x-3 max-[800px]:gap-y-2"
                key={request.id}
              >
                <FiFile
                  className="text-[#111] [stroke-width:1.8]"
                  size={24}
                  aria-hidden="true"
                />
                <p className="m-0 text-[10px] leading-[1.35] text-[#4a1028] max-[800px]:col-start-2">
                  {request.documentoNome}
                </p>
                <p className="m-0 text-[14px] text-[#496084] max-[800px]:col-start-2 max-[800px]:text-[11px]">
                  <span className="hidden pr-1 text-slate-500 max-[800px]:inline">
                    Solicitante:
                  </span>
                  {request.solicitanteNome}
                </p>
                <time className="text-[10px] text-[#333] max-[800px]:col-start-2 max-[800px]:text-[11px]">
                  <span className="hidden pr-1 text-slate-500 max-[800px]:inline">
                    Data:
                  </span>
                  {formatRequestDate(request.data_solicitacao)}
                </time>
                <div className="flex items-center justify-end gap-[7px] max-[800px]:col-start-3 max-[800px]:row-span-3 max-[800px]:row-start-1">
                  <button
                    type="button"
                    className="inline-flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-[2px] border border-[#7a1452] bg-[#7a1452] p-0 text-white hover:brightness-90"
                    aria-label={`Aprovar solicitação de ${request.solicitanteNome} para ${request.documentoNome}`}
                    onClick={() => showMockAction("aprovação")}
                  >
                    <FiCheck size={17} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-[2px] border border-[#bfc2c7] bg-white p-0 text-[#222] hover:brightness-90"
                    aria-label={`Recusar solicitação de ${request.solicitanteNome} para ${request.documentoNome}`}
                    onClick={() => showMockAction("recusa")}
                  >
                    <FiX size={17} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="!mb-3 !mt-auto pt-16 max-[560px]:pt-8"
      />
    </div>
  );
}
