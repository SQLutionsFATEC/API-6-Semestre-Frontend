import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccessRequests from "./AccessRequests";

describe("AccessRequests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza o título, a seção e os dados de cinco solicitações", () => {
    render(<AccessRequests />);

    expect(screen.getByRole("heading", { name: "Solicitações" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Solicitações de acesso" })).toBeInTheDocument();
    const requests = screen.getAllByRole("article");
    expect(requests).toHaveLength(5);
    expect(within(requests[0]).getByText("FAR Part 25.571: Avaliação de Tolerância ao Dano e Fadiga da Estrutura")).toBeInTheDocument();
    expect(within(requests[0]).getByText("Nome do usuário")).toBeInTheDocument();
    expect(within(requests[0]).getByText("09/09/2026")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Aprovar solicitação/ })).toHaveLength(5);
    expect(screen.getAllByRole("button", { name: /Recusar solicitação/ })).toHaveLength(5);
  });

  it("mostra quatro páginas e permite navegar com os controles anterior e próxima", () => {
    render(<AccessRequests />);

    const previousPage = screen.getByRole("button", { name: "Página anterior" });
    const nextPage = screen.getByRole("button", { name: "Próxima página" });

    expect(screen.getByRole("button", { name: "1" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
    expect(previousPage).toBeDisabled();
    expect(nextPage).toBeEnabled();

    fireEvent.click(nextPage);
    expect(screen.getByRole("button", { name: "2" })).toHaveClass("active");
    expect(previousPage).toBeEnabled();
    expect(screen.getAllByRole("article")).toHaveLength(5);

    fireEvent.click(nextPage);
    fireEvent.click(nextPage);
    expect(screen.getByRole("button", { name: "4" })).toHaveClass("active");
    expect(nextPage).toBeDisabled();

    fireEvent.click(previousPage);
    expect(screen.getByRole("button", { name: "3" })).toHaveClass("active");
    expect(nextPage).toBeEnabled();
  });

  it("permite selecionar diretamente uma página", () => {
    render(<AccessRequests />);

    fireEvent.click(screen.getByRole("button", { name: "3" }));

    expect(screen.getByRole("button", { name: "3" })).toHaveClass("active");
    expect(screen.getAllByRole("article")).toHaveLength(5);
  });

  it("exibe feedback mockado ao aprovar uma solicitação", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<AccessRequests />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Aprovar solicitação de Nome do usuário para FAR Part 25.571: Avaliação de Tolerância ao Dano e Fadiga da Estrutura",
      })
    );
    expect(alert).toHaveBeenCalledWith("Ação de aprovação em desenvolvimento.");
  });

  it("exibe feedback mockado ao recusar uma solicitação", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<AccessRequests />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Recusar solicitação/ })[0]
    );

    expect(alert).toHaveBeenCalledWith("Ação de recusa em desenvolvimento.");
  });
});
