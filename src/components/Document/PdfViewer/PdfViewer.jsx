import { useEffect, useRef, useState } from "react";
import { FiX, FiZoomIn, FiZoomOut } from "react-icons/fi";
import {
  getAccessToken,
  restartLoginAfterUnauthorized,
} from "../../../services/keycloak";

const MIN_ZOOM = 50;
const MAX_ZOOM = 400;
const ZOOM_STEP = 25;

function getDocumentFormat(document) {
  const extensionFromName = document?.nome?.match(/\.([^.]+)$/)?.[1];
  const extensionFromUrl = document?.data
    ?.split(/[?#]/)[0]
    .match(/\.([^.]+)$/)?.[1];
  const extension =
    extensionFromName || extensionFromUrl || document?.tipo_arquivo || "";

  return extension.toLowerCase().replace(/^.*\//, "");
}

function PdfViewer({ document, onClose }) {
  const [zoom, setZoom] = useState(100);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRefs = useRef([]);
  const documentFormat = getDocumentFormat(document);

  useEffect(() => {
    if (!document) return undefined;

    window.addEventListener("keydown", handleKeyDown);
    globalThis.document.body.classList.add("pdf-viewer-open");

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      globalThis.document.body.classList.remove("pdf-viewer-open");
    };

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
  }, [document, onClose]);

  useEffect(() => {
    if (!document?.data) return undefined;

    let cancelled = false;
    let loadingTask;

    const loadDocument = async () => {
      try {
        if (documentFormat !== "pdf") {
          throw new Error(`Formato não suportado: ${documentFormat || "desconhecido"}`);
        }

        const [pdfjs, worker] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]);
        if (cancelled) return;

        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const pdfUrl = new URL(document.data, window.location.origin);
        const apiOrigin = new URL(
          import.meta.env.VITE_API_URL || "http://localhost:8000",
          window.location.origin
        ).origin;
        const requestOptions = { url: document.data };

        if (pdfUrl.origin === apiOrigin) {
          const token = await getAccessToken();
          requestOptions.httpHeaders = {
            Authorization: `Bearer ${token}`,
          };
        }

        loadingTask = pdfjs.getDocument({
          ...requestOptions,
        });
        const loadedDocument = await loadingTask.promise;
        if (!cancelled) setPdfDocument(loadedDocument);
      } catch (loadError) {
        if (!cancelled) {
          if (
            loadError.status === 401 ||
            loadError.response?.status === 401
          ) {
            restartLoginAfterUnauthorized();
          }
          console.error("Erro ao carregar PDF:", loadError);
          setError("Não foi possível carregar ou exibir o documento.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDocument();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [document, documentFormat]);

  useEffect(() => {
    if (!pdfDocument) return undefined;

    let cancelled = false;
    const renderTasks = [];

    const renderPages = async () => {
      try {
        await Promise.all(
          Array.from({ length: pdfDocument.numPages }, async (_, index) => {
            const page = await pdfDocument.getPage(index + 1);
            if (cancelled) return;

            const viewport = page.getViewport({ scale: zoom / 100 });
            const canvas = canvasRefs.current[index];
            if (!canvas) return;

            const context = canvas.getContext("2d");
            if (!context) {
              throw new Error("Canvas 2D indisponível para renderizar o PDF.");
            }

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const renderTask = page.render({ canvas, canvasContext: context, viewport });
            renderTasks.push(renderTask);
            await renderTask.promise;
          })
        );
      } catch (renderError) {
        if (!cancelled && renderError.name !== "RenderingCancelledException") {
          console.error("Erro ao renderizar PDF:", renderError);
          setError("Não foi possível exibir o documento.");
        }
      }
    };

    void renderPages();

    return () => {
      cancelled = true;
      renderTasks.forEach((renderTask) => renderTask.cancel());
    };
  }, [pdfDocument, zoom]);

  if (!document) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleZoomOut = () => {
    setZoom((currentZoom) => Math.max(MIN_ZOOM, currentZoom - ZOOM_STEP));
  };

  const handleZoomIn = () => {
    setZoom((currentZoom) => Math.min(MAX_ZOOM, currentZoom + ZOOM_STEP));
  };

  return (
    <div
      className="pdf-viewer-overlay fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/72 p-5 max-[600px]:p-2"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização de ${document.nome}`}
    >
      <section
        className="pdf-viewer flex h-[min(92vh,1000px)] w-[min(1200px,96vw)] flex-col overflow-hidden rounded-xl bg-slate-800 shadow-[0_24px_64px_rgb(0_0_0_/_38%)] max-[600px]:h-[96vh] max-[600px]:w-full"
        onContextMenu={(event) => event.preventDefault()}
      >
        <header className="pdf-viewer-header flex min-h-[60px] items-center gap-4 bg-white p-[10px_16px] max-[600px]:gap-1.5 max-[600px]:p-2">
          <h2
            className="m-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-base text-[#351b27] max-[600px]:text-[13px]"
            title={document.nome}
          >
            {document.nome}
          </h2>
          <div className="pdf-viewer-controls flex items-center gap-3 text-sm text-[#351b27] max-[600px]:gap-1 max-[600px]:text-xs">
            <button
              type="button"
              aria-label="Diminuir zoom"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="inline-flex size-9 items-center justify-center rounded-md border-0 bg-transparent text-[#351b27] hover:enabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <FiZoomOut aria-hidden="true" />
            </button>
            <span aria-live="polite">{zoom}%</span>
            <button
              type="button"
              aria-label="Aumentar zoom"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="inline-flex size-9 items-center justify-center rounded-md border-0 bg-transparent text-[#351b27] hover:enabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <FiZoomIn aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="pdf-viewer-close inline-flex size-9 items-center justify-center rounded-md border-0 bg-transparent text-[#351b27] hover:bg-slate-100"
            aria-label="Fechar visualização"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="pdf-viewer-content flex-1 overflow-auto p-5 text-center text-white [&>p]:my-6">
          {loading && <p role="status">Carregando documento...</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && !error && pdfDocument && (
            <div className="pdf-viewer-pages flex min-w-max flex-col items-center gap-4">
              {Array.from({ length: pdfDocument.numPages }, (_, index) => (
                <canvas
                  key={index + 1}
                  ref={(canvas) => {
                    canvasRefs.current[index] = canvas;
                  }}
                  className="block max-w-none bg-white shadow-[0_2px_12px_rgb(0_0_0_/_28%)]"
                  aria-label={`Página ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default PdfViewer;
