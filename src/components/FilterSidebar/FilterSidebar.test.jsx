import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FilterSidebar from "./FilterSidebar";
import { fetchAllAvailableTags } from "../../services/documentService";

vi.mock("../../services/documentService", () => ({
  fetchAllAvailableTags: vi.fn(),
}));

describe("FilterSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAllAvailableTags).mockResolvedValue([]);
  });

  function renderSidebar(props = {}) {
    return render(
      <FilterSidebar
        isOpen
        onClose={vi.fn()}
        onApplyFilters={vi.fn()}
        onClearFilters={vi.fn()}
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

  it("não exibe as opções de etiquetas quando a busca está vazia", async () => {
    vi.mocked(fetchAllAvailableTags).mockResolvedValue([
      { id_etiqueta: 1, nome: "Segurança" },
      { id_etiqueta: 2, nome: "Redes" },
    ]);

    renderSidebar();

    expect(screen.queryByLabelText("Segurança")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Redes")).not.toBeInTheDocument();
  });

  it("exibe os tipos ao abrir o multiselect", () => {
    renderSidebar();

    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar setor/tipo" })
    );

    expect(screen.getByLabelText("Técnico")).toBeInTheDocument();
    expect(screen.getByLabelText("Normativo")).toBeInTheDocument();
    expect(screen.getByLabelText("Jurídico")).toBeInTheDocument();
    expect(screen.getByLabelText("Qualitativo")).toBeInTheDocument();
  });

  it("filtra as etiquetas enquanto a pessoa digita", async () => {
    vi.mocked(fetchAllAvailableTags).mockResolvedValue([
      { id_etiqueta: 1, nome: "Segurança" },
      { id_etiqueta: 2, nome: "Redes" },
    ]);

    renderSidebar();

    expect(screen.queryByText("Segurança")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Pesquisar etiquetas"), {
      target: { value: "red" },
    });

    expect(await screen.findByText("Redes")).toBeInTheDocument();
    expect(screen.queryByText("Segurança")).not.toBeInTheDocument();
  });

  it("permite selecionar múltiplas etiquetas pesquisando", async () => {
    vi.mocked(fetchAllAvailableTags).mockResolvedValue([
      { id_etiqueta: 1, nome: "Segurança" },
      { id_etiqueta: 2, nome: "Redes" },
    ]);

    renderSidebar();

    fireEvent.change(screen.getByLabelText("Pesquisar etiquetas"), {
      target: { value: "seg" },
    });
    const seguranca = await screen.findByLabelText("Segurança");
    fireEvent.click(seguranca);

    fireEvent.change(screen.getByLabelText("Pesquisar etiquetas"), {
      target: { value: "red" },
    });
    const redes = await screen.findByLabelText("Redes");
    fireEvent.click(redes);

    expect(seguranca).toBeChecked();
    expect(redes).toBeChecked();
  });

  it("exibe e remove as etiquetas selecionadas através dos chips", () => {
    renderSidebar({ filters: { tags: ["Segurança", "Redes"] } });

    expect(screen.getByText("Segurança")).toBeInTheDocument();
    expect(screen.getByText("Redes")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Remover etiqueta Segurança" })
    );

    expect(screen.queryByText("Segurança")).not.toBeInTheDocument();
    expect(screen.getByText("Redes")).toBeInTheDocument();
  });

  it("permite selecionar múltiplos tipos mapeando para as tags correspondentes", () => {
    renderSidebar();

    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar setor/tipo" })
    );
    fireEvent.click(screen.getByLabelText("Técnico"));
    fireEvent.click(screen.getByLabelText("Normativo"));

    expect(screen.getByLabelText("Técnico")).toBeChecked();
    expect(screen.getByLabelText("Normativo")).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Remover Técnico" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remover Normativo" })
    ).toBeInTheDocument();
  });

  it("exibe e remove os tipos selecionados como etiquetas aceitando slugs ou nomes", () => {
    renderSidebar({ filters: { tipo: ["tecnico", "normativo"] } });

    expect(screen.getByText("Técnico")).toBeInTheDocument();
    expect(screen.getByText("Normativo")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remover Técnico" }));

    expect(screen.queryByText("Técnico")).not.toBeInTheDocument();
    expect(screen.getByText("Normativo")).toBeInTheDocument();
  });

  it("permite selecionar uma data de atualização", () => {
    renderSidebar();

    const dateInput = screen.getByLabelText("Atualizado em");

    fireEvent.change(dateInput, {
      target: { value: "2026-09-20" },
    });

    expect(dateInput).toHaveValue("2026-09-20");
  });

  it("aplica os filtros selecionados com os slugs das tags de setor e fecha o painel", async () => {
    const onApplyFilters = vi.fn();
    const onClose = vi.fn();

    vi.mocked(fetchAllAvailableTags).mockResolvedValue([
      { id_etiqueta: 10, nome: "Importante" },
    ]);

    renderSidebar({ onApplyFilters, onClose });

    fireEvent.change(screen.getByLabelText("Pesquisar etiquetas"), {
      target: { value: "Imp" },
    });

    fireEvent.click(await screen.findByLabelText("Importante"));
    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar setor/tipo" })
    );
    fireEvent.click(screen.getByLabelText("Técnico"));

    fireEvent.change(screen.getByLabelText("Atualizado em"), {
      target: { value: "2026-09-20" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(onApplyFilters).toHaveBeenCalledWith({
      tags: ["Importante"],
      tipo: ["tecnico"],
      data_atualizacao: "2026-09-20",
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("limpa os filtros selecionados sem fechar o painel", () => {
    const onApplyFilters = vi.fn();
    const onClearFilters = vi.fn();
    const onClose = vi.fn();

    renderSidebar({
      onApplyFilters,
      onClearFilters,
      onClose,
      filters: {
        tags: ["Importante"],
        tipo: ["tecnico"],
        data_atualizacao: "2026-09-20",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(onClearFilters).toHaveBeenCalledWith({
      tags: [],
      tipo: [],
      data_atualizacao: "",
    });
    expect(onApplyFilters).not.toHaveBeenCalled();

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
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
