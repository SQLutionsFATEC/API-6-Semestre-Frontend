import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LeakWarning from "./LeakWarning";

describe("LeakWarning", () => {
  it("deve renderizar o título e a mensagem correta", () => {
    render(<LeakWarning onClose={vi.fn()} />);

    expect(screen.getByText(/Aviso de vazamento de Dados/i)).toBeInTheDocument();
    expect(screen.getByText(/Identificamos um incidente de segurança recente/i)).toBeInTheDocument();
    expect(screen.getByText(/Medidas de proteção foram aplicadas preventivamente/i)).toBeInTheDocument();
  });

  it("deve chamar onClose ao clicar no botão X", () => {
    const handleClose = vi.fn();
    render(<LeakWarning onClose={handleClose} />);

    const closeButton = screen.getByRole("button", { name: /Fechar aviso/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});