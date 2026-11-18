import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AccessRequests from "./AccessRequests";
import {
  fetchAccessRequests,
  resolveAccessRequestDetails,
  updateAccessRequest,
} from "../../services/accessRequestService";

vi.mock("../../services/accessRequestService", () => ({
  fetchAccessRequests: vi.fn(),
  resolveAccessRequestDetails: vi.fn(),
  updateAccessRequest: vi.fn(),
}));

const PAGE_ONE = [
  {
    id: 1,
    documento_id: 3,
    usuario_id: "usuario-1",
    data_solicitacao: "2026-09-09T10:00:00Z",
    approved: false,
    documentoNome: "FAR Part 25.571: Avaliação de Tolerância ao Dano",
    solicitanteNome: "Maria Silva",
  },
  {
    id: 2,
    documento_id: 4,
    usuario_id: "usuario-2",
    data_solicitacao: "2026-09-10T10:00:00Z",
    approved: false,
    documentoNome: "Manual de procedimentos técnicos",
    solicitanteNome: "João Souza",
  },
];

function mockPage(results, count = results.length) {
  fetchAccessRequests.mockResolvedValue({ count, results });
  resolveAccessRequestDetails.mockImplementation(async (solicitacoes) =>
    solicitacoes
  );
}

describe("AccessRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage([], 0);
    updateAccessRequest.mockResolvedValue({ id: 1, approved: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("carrega a primeira página de solicitações da API", async () => {
    mockPage(PAGE_ONE);

    render(<AccessRequests />);

    expect(screen.getByRole("heading", { name: "Solicitações" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Solicitações de acesso" })
    ).toBeInTheDocument();

    const requests = await screen.findAllByRole("article");
    expect(requests).toHaveLength(2);
    expect(
      within(requests[0]).getByText("FAR Part 25.571: Avaliação de Tolerância ao Dano")
    ).toBeInTheDocument();
    expect(within(requests[0]).getByText("Maria Silva")).toBeInTheDocument();
    expect(within(requests[0]).getByText("09/09/2026")).toBeInTheDocument();

    expect(fetchAccessRequests).toHaveBeenCalledWith({ page: 1 });
    expect(resolveAccessRequestDetails).toHaveBeenCalledWith(PAGE_ONE);
    expect(
      screen.getByRole("button", {
        name: "Aprovar solicitação de Maria Silva para FAR Part 25.571: Avaliação de Tolerância ao Dano",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Recusar solicitação de João Souza para Manual de procedimentos técnicos",
      })
    ).toBeInTheDocument();
  });

  it("exibe o estado de carregamento e esconde a lista", async () => {
    fetchAccessRequests.mockReturnValue(new Promise(() => {}));

    render(<AccessRequests />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Carregando solicitações..."
    );
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("exibe mensagem de erro quando a busca falha", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchAccessRequests.mockRejectedValue(new Error("falha"));

    render(<AccessRequests />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar as solicitações de acesso."
    );
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Erro ao buscar solicitações de acesso:",
      expect.any(Error)
    );
  });

  it("informa quando não há solicitações de acesso", async () => {
    mockPage([], 0);

    render(<AccessRequests />);

    expect(
      await screen.findByText("Nenhuma solicitação de acesso encontrada.")
    ).toBeInTheDocument();
  });

  it("pagina as solicitações conforme a contagem da API", async () => {
    mockPage(PAGE_ONE, 12);

    render(<AccessRequests />);

    await screen.findAllByRole("article");

    const previousPage = screen.getByRole("button", { name: "Página anterior" });
    const nextPage = screen.getByRole("button", { name: "Próxima página" });

    expect(screen.getByRole("button", { name: "1" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "3" })).not.toBeInTheDocument();
    expect(previousPage).toBeDisabled();

    mockPage([
      {
        id: 3,
        documento_id: 5,
        usuario_id: "usuario-3",
        data_solicitacao: "2026-09-11T10:00:00Z",
        approved: false,
        documentoNome: "Relatório de análise de segurança",
        solicitanteNome: "Ana Lima",
      },
    ], 12);

    fireEvent.click(nextPage);

    await waitFor(() => {
      expect(fetchAccessRequests).toHaveBeenCalledWith({ page: 2 });
    });

    expect(await screen.findByText("Relatório de análise de segurança")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "2" })).toHaveClass("active");
    expect(nextPage).toBeDisabled();
  });

  it("permite selecionar diretamente uma página", async () => {
    mockPage(PAGE_ONE, 12);

    render(<AccessRequests />);

    await screen.findAllByRole("article");

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() => {
      expect(fetchAccessRequests).toHaveBeenCalledWith({ page: 2 });
    });
  });

  it("aprova a solicitação e alerta o sucesso da ação", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    mockPage(PAGE_ONE);

    render(<AccessRequests />);

    await screen.findAllByRole("article");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Aprovar solicitação de Maria Silva para FAR Part 25.571: Avaliação de Tolerância ao Dano",
      })
    );

    await waitFor(() => {
      expect(updateAccessRequest).toHaveBeenCalledWith(1, true);
      expect(alert).toHaveBeenCalledWith(
        "Solicitação de acesso aprovada com sucesso."
      );
    });

    await waitFor(() => {
      expect(fetchAccessRequests).toHaveBeenCalledTimes(2);
    });
  });

  it("recusa a solicitação e alerta o sucesso da ação", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    mockPage(PAGE_ONE);

    render(<AccessRequests />);

    await screen.findAllByRole("article");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Recusar solicitação de João Souza para Manual de procedimentos técnicos",
      })
    );

    await waitFor(() => {
      expect(updateAccessRequest).toHaveBeenCalledWith(2, false);
      expect(alert).toHaveBeenCalledWith(
        "Solicitação de acesso recusada com sucesso."
      );
    });
  });

  it("alerta a falha ao aprovar a solicitação", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    updateAccessRequest.mockRejectedValue(new Error("falha"));
    mockPage(PAGE_ONE);

    render(<AccessRequests />);

    await screen.findAllByRole("article");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Aprovar solicitação de Maria Silva para FAR Part 25.571: Avaliação de Tolerância ao Dano",
      })
    );

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith(
        "Não foi possível concluir a aprovação da solicitação de acesso. Tente novamente."
      );
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Erro ao registrar a aprovação da solicitação de acesso:",
      expect.any(Error)
    );
    expect(fetchAccessRequests).toHaveBeenCalledTimes(1);
  });

  it("alerta a falha ao recusar a solicitação", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    updateAccessRequest.mockRejectedValue(new Error("falha"));
    mockPage(PAGE_ONE);

    render(<AccessRequests />);

    await screen.findAllByRole("article");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Recusar solicitação de João Souza para Manual de procedimentos técnicos",
      })
    );

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith(
        "Não foi possível concluir a recusa da solicitação de acesso. Tente novamente."
      );
    });
  });

  it("desabilita as ações enquanto uma solicitação é atualizada", async () => {
    let resolveUpdate;
    updateAccessRequest.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      })
    );
    mockPage(PAGE_ONE);
    vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<AccessRequests />);

    await screen.findAllByRole("article");

    fireEvent.click(
      screen.getByRole("button", { name: /Aprovar solicitação de Maria Silva/ })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Recusar solicitação de João Souza/ })
      ).toBeDisabled();
    });

    resolveUpdate({ id: 1, approved: true });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Recusar solicitação de João Souza/ })
      ).toBeEnabled();
    });
  });
});
