
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FilterSidebar from "./FilterSidebar";
import { fetchTags } from "../../services/documentService";

vi.mock("../../services/documentService", () => ({
  fetchTags: vi.fn(),
}));

describe("FilterSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchTags).mockResolvedValue([]);
  });

  function renderSidebar(props = {}) {
    return render(
      <FilterSidebar
        isOpen
        onClose={vi.fn()}
        onApplyFilters={vi.fn()}
        {...props}
      />
    );
  }

  it("não renderiza quando está fechado", () => {
    renderSidebar({ isOpen: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza as seções de filtros", () => {
    renderSidebar();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Etiquetas")).toBeInTheDocument();
    expect(screen.getByText("Setor/Tipo")).toBeInTheDocument();
    expect(screen.getByText("Data de atualização")).toBeInTheDocument();
    expect(screen.getByLabelText("Atualizado em")).toBeInTheDocument();
  });

  it("renderiza os quatro tipos disponíveis", () => {
    renderSidebar();

    expect(screen.getByLabelText("Técnico")).toBeInTheDocument();
    expect(screen.getByLabelText("Normativo")).toBeInTheDocument();
    expect(screen.getByLabelText("Judiciário")).toBeInTheDocument();
    expect(screen.getByLabelText("Qualitativo")).toBeInTheDocument();
  });

  it("não consulta etiquetas com menos de dois caracteres", async () => {
    renderSidebar();

    fireEvent.change(screen.getByLabelText("Pesquisar etiquetas"), {
      target: { value: "a" },
    });

    await waitFor(() => {
      expect(fetchTags).not.toHaveBeenCalled();
    });
  });

  it("busca etiquetas quando a pesquisa tem pelo menos dois caracteres", async () => {
    vi.mocked(fetchTags).mockResolvedValue([
      { id_etiqueta: 1, nome: "Segurança" },
      { id_etiqueta: 2, nome: "Redes" },
    ]);

    renderSidebar();

    fireEvent.change(screen.getByLabelText("Pesquisar etiquetas"), {
      target: { value: "se" },
    });

    expect(await screen.findByText("Segurança")).toBeInTheDocument();
    expect(screen.getByText("Redes")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchTags).toHaveBeenCalledWith("se");
    });
  });

  it("permite selecionar múltiplas etiquetas", async () => {
    vi.mocked(fetchTags).mockResolvedValue([
      { id_etiqueta: 1, nome: "Segurança" },
      { id_etiqueta: 2, nome: "Redes" },
    ]);

    renderSidebar();

    fireEvent.change(screen.getByLabelText("Pesquisar etiquetas"), {
      target: { value: "re" },
    });

    const seguranca = await screen.findByLabelText("Segurança");
    const redes = screen.getByLabelText("Redes");

    fireEvent.click(seguranca);
    fireEvent.click(redes);

    expect(seguranca).toBeChecked();
    expect(redes).toBeChecked();
  });

  it("permite selecionar múltiplos tipos", () => {
    renderSidebar();

    fireEvent.click(screen.getByLabelText("Técnico"));
    fireEvent.click(screen.getByLabelText("Normativo"));

    expect(screen.getByLabelText("Técnico")).toBeChecked();
    expect(screen.getByLabelText("Normativo")).toBeChecked();
  });

  it("permite selecionar uma data de atualização", () => {
    renderSidebar();

    const dateInput = screen.getByLabelText("Atualizado em");

    fireEvent.change(dateInput, {
      target: { value: "2026-09-20" },
    });

    expect(dateInput).toHaveValue("2026-09-20");
  });

  it("aplica os filtros selecionados e fecha o painel", async () => {
    const onApplyFilters = vi.fn();
    const onClose = vi.fn();

    vi.mocked(fetchTags).mockResolvedValue([
      { id_etiqueta: 10, nome: "Importante" },
    ]);

    renderSidebar({ onApplyFilters, onClose });

    fireEvent.change(screen.getByLabelText("Pesquisar etiquetas"), {
      target: { value: "im" },
    });

    fireEvent.click(await screen.findByLabelText("Importante"));
    fireEvent.click(screen.getByLabelText("Técnico"));

    fireEvent.change(screen.getByLabelText("Atualizado em"), {
      target: { value: "2026-09-20" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(onApplyFilters).toHaveBeenCalledWith({
      tags: [10],
      tipo: ["Técnico"],
      data_atualizacao: "2026-09-20",
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("limpa os filtros selecionados", () => {
    const onApplyFilters = vi.fn();
    const onClose = vi.fn();

    renderSidebar({
      onApplyFilters,
      onClose,
      filters: {
        tags: [10],
        tipo: ["Técnico"],
        data_atualizacao: "2026-09-20",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(onApplyFilters).toHaveBeenCalledWith({
      tags: [],
      tipo: [],
      data_atualizacao: "",
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("fecha pelo botão X", () => {
    const onClose = vi.fn();

    renderSidebar({ onClose });

    fireEvent.click(
      screen.getByRole("button", { name: "Fechar filtros" })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha quando clica no overlay", () => {
    const onClose = vi.fn();

    renderSidebar({ onClose });

    fireEvent.mouseDown(screen.getByTestId("filter-overlay"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
