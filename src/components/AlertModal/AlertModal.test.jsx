import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AlertModal from "./AlertModal";

function renderAlert(props = {}) {
  return render(
    <AlertModal
      isOpen={true}
      title="Título do alerta"
      message="Mensagem do alerta."
      onClose={vi.fn()}
      {...props}
    />
  );
}

describe("AlertModal", () => {
  it("não renderiza nada quando isOpen é false", () => {
    const { container } = renderAlert({ isOpen: false });

    expect(container).toBeEmptyDOMElement();
  });

  it("exibe título e mensagem em um alerta de sucesso", () => {
    renderAlert({ type: "success" });

    const dialog = screen.getByRole("alertdialog", {
      name: "Título do alerta",
    });

    expect(dialog).toHaveTextContent("Mensagem do alerta.");
    expect(
      screen.getByRole("button", { name: "Concluir" })
    ).toBeInTheDocument();
  });

  it("usa o estilo e o rótulo de erro quando type é error", () => {
    renderAlert({ type: "error" });

    expect(
      screen.getByRole("alertdialog", { name: "Título do alerta" })
    ).toHaveTextContent("Mensagem do alerta.");
    expect(screen.getByRole("button", { name: "Entendi" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Concluir" })
    ).not.toBeInTheDocument();
  });

  it("chama onClose ao clicar no botão de ação", () => {
    const onClose = vi.fn();
    renderAlert({ onClose });

    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onClose ao clicar no botão de fechar", () => {
    const onClose = vi.fn();
    renderAlert({ onClose });

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onClose ao clicar fora do cartão", () => {
    const onClose = vi.fn();
    renderAlert({ onClose });

    fireEvent.click(screen.getByRole("alertdialog"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("não fecha ao clicar dentro do cartão", () => {
    const onClose = vi.fn();
    renderAlert({ onClose });

    fireEvent.click(screen.getByText("Mensagem do alerta."));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("fecha ao pressionar a tecla Escape", () => {
    const onClose = vi.fn();
    renderAlert({ onClose });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
