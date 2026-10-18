import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SearchBar from "./SearchBar";

describe("SearchBar", () => {
  it("renderiza o campo de pesquisa com o placeholder padrão", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);

    expect(
      screen.getByPlaceholderText("Pesquise por nome, tag, conteúdo ou autor..."),
    ).toBeInTheDocument();
  });

  it("renderiza o valor recebido", () => {
    render(<SearchBar value="NASA" onChange={vi.fn()} />);

    expect(screen.getByDisplayValue("NASA")).toBeInTheDocument();
  });

  it("chama onChange com o novo valor", () => {
    const onChange = vi.fn();

    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText(
      "Pesquise por nome, tag, conteúdo ou autor...",
    );

    fireEvent.change(input, {
      target: {
        value: "MIL-HDBK",
      },
    });

    expect(onChange).toHaveBeenCalledWith("MIL-HDBK");
  });

  it("renderiza as 3 pílulas de pesquisa: Nome, Tags e Conteúdo", () => {
    render(<SearchBar value="" onChange={vi.fn()} searchMode="nome" />);

    expect(screen.getByRole("tab", { name: /nome/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /tags/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /conteúdo/i })).toBeInTheDocument();
  });

  it("chama onModeChange ao clicar em uma pílula de pesquisa", () => {
    const onModeChange = vi.fn();
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        searchMode="nome"
        onModeChange={onModeChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /tags/i }));
    expect(onModeChange).toHaveBeenCalledWith("tags");

    fireEvent.click(screen.getByRole("tab", { name: /conteúdo/i }));
    expect(onModeChange).toHaveBeenCalledWith("conteudo");
  });

  it("permite limpar a pesquisa pelo botão de limpar", () => {
    const onChange = vi.fn();
    render(<SearchBar value="documento teste" onChange={onChange} />);

    const clearButton = screen.getByLabelText("Limpar pesquisa");
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("abre e fecha a ajuda didática sobre a pesquisa", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);

    const helpButton = screen.getByLabelText("Ajuda sobre a pesquisa");
    expect(helpButton).toBeInTheDocument();

    fireEvent.click(helpButton);
    expect(
      screen.getByText(/como pesquisar documentos\?/i),
    ).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Fechar ajuda");
    fireEvent.click(closeButton);
    expect(
      screen.queryByText(/como pesquisar documentos\?/i),
    ).not.toBeInTheDocument();
  });
});
