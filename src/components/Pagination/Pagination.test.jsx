import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Pagination from "./Pagination";

describe("Pagination", () => {
  it("não renderiza quando existe apenas uma página", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /página anterior/i }),
    ).not.toBeInTheDocument();
  });

  it("renderiza todas as páginas", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
  });

  it("chama onPageChange ao selecionar uma página", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("desabilita a página anterior na primeira página", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /página anterior/i }),
    ).toBeDisabled();
  });

  it("desabilita a próxima página na última página", () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /próxima página/i }),
    ).toBeDisabled();
  });
});
