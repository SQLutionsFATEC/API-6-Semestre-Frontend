import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccessRequests from "./AccessRequests";

describe("AccessRequests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza solicitações mockadas com solicitante, data e ações", () => {
    render(<AccessRequests />);

    expect(screen.getByRole("heading", { name: "Solicitações" })).toBeInTheDocument();
    expect(screen.getAllByText("Nome do usuário")).toHaveLength(6);
    expect(screen.getAllByRole("button", { name: /Aprovar solicitação/ })).toHaveLength(5);
    expect(screen.getAllByRole("button", { name: /Recusar solicitação/ })).toHaveLength(5);
    expect(screen.getAllByText("09/09/2026")).toHaveLength(5);
  });

  it("permite paginar as solicitações mockadas", () => {
    render(<AccessRequests />);

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByText("Relatório de análise de segurança da informação")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toHaveClass("active");
  });

  it("informa quando uma ação mockada é selecionada", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<AccessRequests />);

    fireEvent.click(screen.getAllByRole("button", { name: /Aprovar solicitação/ })[0]);
    expect(alert).toHaveBeenCalledWith("Ação de aprovação em desenvolvimento.");
  });
});
