import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SearchBar from "./SearchBar";

describe("SearchBar", () => {
  it("renderiza o campo de pesquisa", () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByPlaceholderText("Pesquisar documentos..."),
    ).toBeInTheDocument();
  });

  it("renderiza o valor recebido", () => {
    render(
      <SearchBar
        value="NASA"
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByDisplayValue("NASA"),
    ).toBeInTheDocument();
  });

  it("chama onChange com o novo valor", () => {
    const onChange = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={onChange}
      />,
    );

    const input = screen.getByPlaceholderText(
      "Pesquisar documentos...",
    );

    fireEvent.change(input, {
      target: {
        value: "MIL-HDBK",
      },
    });

    expect(onChange).toHaveBeenCalledWith("MIL-HDBK");
  });
});
