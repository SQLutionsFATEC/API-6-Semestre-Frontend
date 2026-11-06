import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ConsentManagerModal from "./ConsentManagerModal";

const mockTerms = [
  { id: 1, description: "Utilização e coleta de seu nome", required: true },
  {
    id: 2,
    description: "Utilização e coleta de seu e-mail (Opcional)",
    required: false,
  },
  { id: 3, description: "Compartilhamento com parceiros", required: true },
];

function renderModal(overrides = {}) {
  const props = {
    terms: mockTerms,
    acceptedTermIds: [],
    onSave: vi.fn().mockResolvedValue({ success: true }),
    onClose: vi.fn(),
    ...overrides,
  };

  render(<ConsentManagerModal {...props} />);

  return props;
}

function startEditing() {
  fireEvent.click(
    screen.getByRole("button", { name: /Gerenciar Consentimentos/i })
  );
}

describe("ConsentManagerModal", () => {
  it("lista todos os termos recebidos dinamicamente", () => {
    renderModal();

    expect(
      screen.getByRole("heading", { name: "Termos e Condições" })
    ).toBeInTheDocument();

    mockTerms.forEach((term) => {
      expect(screen.getByText(term.description)).toBeInTheDocument();
    });
  });

  it("exibe os consentimentos já aceitos no modo de leitura", () => {
    renderModal({ acceptedTermIds: [2] });

    expect(
      screen.getByRole("checkbox", { name: /coleta de seu e-mail/i })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /coleta de seu nome/i })
    ).not.toBeChecked();
  });

  it("mantém os checkboxes desabilitados até clicar em Gerenciar Consentimentos", () => {
    renderModal();

    expect(
      screen.getByRole("checkbox", { name: /coleta de seu nome/i })
    ).toBeDisabled();

    startEditing();

    expect(
      screen.getByRole("checkbox", { name: /coleta de seu nome/i })
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /Salvar alterações/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cancelar/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Gerenciar Consentimentos/i })
    ).not.toBeInTheDocument();
  });

  it("desabilita o salvamento enquanto um termo obrigatório estiver desmarcado", () => {
    renderModal({ acceptedTermIds: [1, 3] });

    startEditing();

    const requiredCheckbox = screen.getByRole("checkbox", {
      name: /coleta de seu nome/i,
    });
    fireEvent.click(requiredCheckbox);

    expect(
      screen.getByRole("button", { name: /Salvar alterações/i })
    ).toBeDisabled();
    expect(
      screen.getByText(
        /\*Este termo é obrigatório para utilizar a aplicação/i
      )
    ).toBeInTheDocument();
  });

  it("salva a lista de termos marcados ao clicar em Salvar alterações", async () => {
    const props = renderModal({ acceptedTermIds: [1, 3] });

    startEditing();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /coleta de seu e-mail/i })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Salvar alterações/i })
    );

    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  it("salva ao remover o consentimento de um termo opcional", async () => {
    const props = renderModal({ acceptedTermIds: [1, 2, 3] });

    startEditing();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /coleta de seu e-mail/i })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Salvar alterações/i })
    );

    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith([1, 3]);
    });
  });

  it("fecha ao clicar em Cancelar sem salvar as alterações", () => {
    const props = renderModal({ acceptedTermIds: [1] });

    startEditing();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /coleta de seu e-mail/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));

    expect(props.onSave).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha ao clicar fora do card", () => {
    const props = renderModal();

    fireEvent.click(screen.getByRole("dialog").parentElement);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha ao pressionar Escape", () => {
    const props = renderModal();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("exibe mensagem de erro e permanece aberto quando o salvamento falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const props = renderModal({
      acceptedTermIds: [1, 3],
      onSave: vi.fn().mockRejectedValue(new Error("falha")),
    });

    startEditing();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /coleta de seu e-mail/i })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Salvar alterações/i })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível salvar suas alterações. Tente novamente mais tarde."
    );
    expect(props.onClose).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /Salvar alterações/i })
    ).toBeEnabled();

    vi.restoreAllMocks();
  });
});
