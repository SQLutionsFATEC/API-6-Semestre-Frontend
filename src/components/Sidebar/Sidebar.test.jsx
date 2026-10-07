import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  it("renderiza a logo no topo da sidebar", () => {
    render(<Sidebar />);

    const logoImg = screen.getByRole("img", { name: /IAzimute/i });
    expect(logoImg).toBeInTheDocument();
  });

  it("renderiza o botão 'Cadastrar documento' acima do botão 'Deslogar'", () => {
    render(<Sidebar />);

    const uploadBtn = screen.getByRole("button", { name: /Cadastrar documento/i });
    const logoutBtn = screen.getByRole("button", { name: /Deslogar/i });

    expect(uploadBtn).toBeInTheDocument();
    expect(logoutBtn).toBeInTheDocument();
  });

  it("chama o callback ao clicar no botão de cadastrar documento", () => {
    const handleOpen = vi.fn();
    render(<Sidebar onOpenUploadModal={handleOpen} />);

    const uploadBtn = screen.getByRole("button", { name: /Cadastrar documento/i });
    fireEvent.click(uploadBtn);

    expect(handleOpen).toHaveBeenCalledTimes(1);
  });

  it("abre e fecha o modal de upload ao clicar no botão de fechar", () => {
    render(<Sidebar />);

    const uploadBtn = screen.getByRole("button", { name: /Cadastrar documento/i });
    fireEvent.click(uploadBtn);

    expect(
      screen.getByRole("heading", { name: "Cadastrar documento" })
    ).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Fechar" });
    fireEvent.click(closeBtn);

    expect(
      screen.queryByRole("heading", { name: "Cadastrar documento" })
    ).not.toBeInTheDocument();
  });
});
