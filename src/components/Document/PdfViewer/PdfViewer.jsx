import { useEffect, useRef, useState } from "react";
import { FiX, FiZoomIn, FiZoomOut } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "./PdfViewer.css";

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
  const [wordMarkdown, setWordMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRefs = useRef([]);
  const wordContentRef = useRef(null);
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
    const controller = new AbortController();
    const wordContentElement = wordContentRef.current;

    const loadDocument = async () => {
      try {
        if (documentFormat === "pdf") {
          const [pdfjs, worker] = await Promise.all([
            import("pdfjs-dist"),
            import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
          ]);
          if (cancelled) return;

          pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
          loadingTask = pdfjs.getDocument({
            url: document.data,
          });
          const loadedDocument = await loadingTask.promise;
          if (!cancelled) setPdfDocument(loadedDocument);
          return;
        }

        if (documentFormat !== "doc" && documentFormat !== "docx") {
          throw new Error(`Formato não suportado: ${documentFormat || "desconhecido"}`);
        }

        const response = await fetch(document.data, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Falha ao buscar o documento (${response.status}).`);
        }

        const content = await response.arrayBuffer();
        if (cancelled) return;

        if (documentFormat === "docx") {
          const { renderAsync } = await import("docx-preview");
          if (cancelled || !wordContentElement) return;

          wordContentElement.replaceChildren();
          await renderAsync(
            content,
            wordContentElement,
            wordContentElement,
            { inWrapper: true }
          );
        } else {
          const { toMarkdown } = await import("@mdgate/doc");
          const markdown = await toMarkdown(new Uint8Array(content));
          if (!cancelled) setWordMarkdown(markdown);
        }
      } catch (loadError) {
        if (!cancelled && loadError.name !== "AbortError") {
          console.error("Erro ao carregar PDF:", loadError);
          setError("Não foi possível carregar ou exibir o documento.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
      controller.abort();
      loadingTask?.destroy();
      wordContentElement?.replaceChildren();
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

    renderPages();

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
      className="pdf-viewer-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização de ${document.nome}`}
    >
      <section
        className="pdf-viewer"
        onContextMenu={(event) => event.preventDefault()}
      >
        <header className="pdf-viewer-header">
          <h2 title={document.nome}>{document.nome}</h2>
          <div className="pdf-viewer-controls">
            <button
              type="button"
              aria-label="Diminuir zoom"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
            >
              <FiZoomOut aria-hidden="true" />
            </button>
            <span aria-live="polite">{zoom}%</span>
            <button
              type="button"
              aria-label="Aumentar zoom"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
            >
              <FiZoomIn aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="pdf-viewer-close"
            aria-label="Fechar visualização"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="pdf-viewer-content">
          {loading && <p role="status">Carregando documento...</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && !error && pdfDocument && (
            <div className="pdf-viewer-pages">
              {Array.from({ length: pdfDocument.numPages }, (_, index) => (
                <canvas
                  key={index + 1}
                  ref={(canvas) => {
                    canvasRefs.current[index] = canvas;
                  }}
                  aria-label={`Página ${index + 1}`}
                />
              ))}
            </div>
          )}
          {documentFormat === "docx" && (
            <div
              className="word-viewer-stage"
              style={{ zoom: zoom / 100 }}
              hidden={loading || Boolean(error)}
            >
              <div ref={wordContentRef} className="word-docx-content" />
            </div>
          )}
          {!loading && !error && documentFormat === "doc" && (
            <div className="word-viewer-stage" style={{ zoom: zoom / 100 }}>
              {wordMarkdown ? (
                <article className="word-markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {wordMarkdown}
                  </ReactMarkdown>
                </article>
              ) : (
                <p>Este arquivo não contém texto que possa ser exibido.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default PdfViewer;
