import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RestrictedModal from "./RestrictedModal";

describe("RestrictedModal", () => {
  it("não renderiza nada quando isOpen é false", () => {
    const { container } = render(
      <RestrictedModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("exibe o título e a mensagem de acesso restrito quando aberto", () => {
    render(<RestrictedModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Acesso Restrito" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Você não possui nível ou setor adequado para visualizar este arquivo. É necessário enviar uma requisição ao Operador."
      )
    ).toBeInTheDocument();
  });

  it("chama onClose ao clicar no botão de fechar", () => {
    const onClose = vi.fn();
    render(<RestrictedModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onClose ao clicar no overlay", () => {
    const onClose = vi.fn();
    render(<RestrictedModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("não fecha ao clicar no conteúdo do modal", () => {
    const onClose = vi.fn();
    render(<RestrictedModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByText("Acesso Restrito"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("fecha ao pressionar a tecla Escape", () => {
    const onClose = vi.fn();
    render(<RestrictedModal isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
