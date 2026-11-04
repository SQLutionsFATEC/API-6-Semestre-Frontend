import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TermsModal from "./TermsModal";

const mockTerms = [
  { id: 1, description: "Utilização e coleta de seu nome", required: true },
  {
    id: 2,
    description: "Utilização e coleta de seu e-mail (Opcional)",
    required: false,
  },
];

describe("TermsModal", () => {
  it("deve desabilitar o botão Aceitar se os termos obrigatórios não estiverem marcados", () => {
    render(
      <TermsModal terms={mockTerms} onAccept={vi.fn()} onDecline={vi.fn()} />
    );

    const acceptButton = screen.getByRole("button", { name: /Aceitar/i });
    expect(acceptButton).toBeDisabled();
  });

  it("deve habilitar o botão Aceitar ao marcar o termo obrigatório", () => {
    render(
      <TermsModal terms={mockTerms} onAccept={vi.fn()} onDecline={vi.fn()} />
    );

    const requiredCheckbox = screen.getByRole("checkbox", {
      name: /Utilização e coleta de seu nome/i,
    });
    fireEvent.click(requiredCheckbox);

    const acceptButton = screen.getByRole("button", { name: /Aceitar/i });
    expect(acceptButton).not.toBeDisabled();
  });

  it("deve exibir a mensagem de erro ao lado do termo obrigatório não marcado", () => {
    render(
      <TermsModal terms={mockTerms} onAccept={vi.fn()} onDecline={vi.fn()} />
    );

    expect(
      screen.getByText(/\*Este termo é obrigatório para utilizar a aplicação/i)
    ).toBeInTheDocument();
  });

  it("deve chamar onAccept com os IDs corretos ao clicar em Aceitar", () => {
    const handleAccept = vi.fn();
    render(
      <TermsModal
        terms={mockTerms}
        onAccept={handleAccept}
        onDecline={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: /Utilização e coleta de seu nome/i })
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Utilização e coleta de seu e-mail/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /Aceitar/i }));

    expect(handleAccept).toHaveBeenCalledWith([1, 2]);
  });

  it("deve exibir o modal de Aviso ao clicar em Recusar", () => {
    render(
      <TermsModal terms={mockTerms} onAccept={vi.fn()} onDecline={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Recusar/i }));

    expect(
      screen.getByText(/Aviso sobre Consentimento/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Você será deslogado e todos os/i)
    ).toBeInTheDocument();
  });

  it("deve chamar onDecline ao clicar em Continuar no aviso", () => {
    const handleDecline = vi.fn();
    render(
      <TermsModal
        terms={mockTerms}
        onAccept={vi.fn()}
        onDecline={handleDecline}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Recusar/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    expect(handleDecline).toHaveBeenCalledTimes(1);
  });

  it("deve voltar para a tela de termos ao clicar em Cancelar no aviso", () => {
    render(
      <TermsModal terms={mockTerms} onAccept={vi.fn()} onDecline={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Recusar/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));

    expect(screen.getByText(/Termos e Condições - IAzimuth/i)).toBeInTheDocument();
  });
});