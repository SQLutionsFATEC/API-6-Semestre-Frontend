import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchManagedUsers, updateManagedUser } from "../../services/userService";
import UserManagement from "./UserManagement";

vi.mock("../../services/userService", () => ({
  fetchManagedUsers: vi.fn(),
  updateManagedUser: vi.fn(),
}));

beforeEach(() => {
  vi.spyOn(window, "alert").mockImplementation(() => { });
  fetchManagedUsers.mockResolvedValue(Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    nome: index === 3 ? "Operador de teste" : "Nome do usuário",
    email: index === 3 ? "operador.teste@email.com" : `usuario${index + 1}@email.com`,
    setor: "tecnico",
    nivel_acesso: index === 3 ? "operador" : "militar",
  })));
  updateManagedUser.mockImplementation(async (id, data) => ({
    id,
    nome: data.nome,
    email: data.email,
    setor: data.setor.toLowerCase(),
    nivel_acesso: data.nivel_acesso.toLowerCase(),
  }));
});

describe("UserManagement", () => {
  it("normaliza valores alternativos e desconhecidos vindos do backend", async () => {
    fetchManagedUsers.mockResolvedValueOnce([
      {
        id: 1,
        nome: "",
        username: "Usuário legado",
        email: "",
        setor: "JURÍDICO",
        nivel_acesso: "",
      },
      {
        id: 2,
        username: "",
        setor: "desconhecido",
        nivel_acesso: null,
      },
    ]);
    render(<UserManagement />);

    expect(await screen.findByText("Usuário legado")).toBeInTheDocument();
    expect(screen.getByText("Jurídico")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Editar usuário\s*$/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Editar usuário Usuário legado" }));
    expect(screen.getByLabelText("Setor")).toHaveValue("Jurídico");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("heading", { name: "Editar Usuário" })).not.toBeInTheDocument();
  });

  it.each([
    ["erro detalhado", { response: { data: { erro: "Falha específica ao buscar." } } }, "Falha específica ao buscar."],
    ["detalhe alternativo", { response: { data: { detail: "Consulta indisponível." } } }, "Consulta indisponível."],
    ["mensagem padrão", new Error("offline"), "Não foi possível consultar os usuários no backend."],
  ])("exibe e permite fechar a falha de carregamento (%s)", async (_case, error, message) => {
    fetchManagedUsers.mockRejectedValueOnce(error);
    render(<UserManagement />);

    expect(await screen.findByRole("heading", { name: "Falha ao carregar usuários" })).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("lista usuários com paginação de cinco registros", async () => {
    render(<UserManagement />);

    expect(await screen.findAllByRole("button", { name: /(?:Editar usuário|Usuário operador bloqueado)/ })).toHaveLength(5);
    expect(screen.getByText("Páginas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByText("usuario6@email.com")).toBeInTheDocument();
    expect(screen.queryByText("usuario1@email.com")).not.toBeInTheDocument();
  });

  it("abre a edição ao selecionar o cartão e oferece somente opções permitidas", async () => {
    render(<UserManagement />);
    fireEvent.click((await screen.findAllByRole("button", { name: /Editar usuário/ }))[0]);

    expect(screen.getByRole("heading", { name: "Editar Usuário" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Setor")).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Técnico", "Normativo", "Jurídico", "Qualitativo",
    ]);
    expect(within(screen.getByLabelText("Nível de Acesso")).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Básico", "Comercial", "Militar",
    ]);
  });

  it("bloqueia a edição de outro operador e mostra o indicador de cadeado", async () => {
    render(<UserManagement />);

    const operatorCard = await screen.findByRole("button", {
      name: "Usuário operador bloqueado: Operador de teste",
    });
    expect(screen.getByText("operador.teste@email.com")).toBeInTheDocument();
    expect(operatorCard.querySelector("[title='Operador: edição bloqueada']")).toBeInTheDocument();

    fireEvent.click(operatorCard);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Operadores não podem alterar os dados de outros operadores.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Editar Usuário" })).not.toBeInTheDocument();
  });

  it("valida o email e alerta o erro sem salvar", async () => {
    render(<UserManagement />);
    fireEvent.click((await screen.findAllByRole("button", { name: /Editar usuário/ }))[0]);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "email-invalido" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));

    expect(window.alert).toHaveBeenCalledWith(
      "Erro de validação: Informe um endereço de email válido."
    );
    expect(screen.getByText("Informe um endereço de email válido.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Editar Usuário" })).toBeInTheDocument();
  });

  it("rejeita formatos de email malformados, mesmo com arroba e domínio", async () => {
    render(<UserManagement />);
    fireEvent.click((await screen.findAllByRole("button", { name: /Editar usuário/ }))[0]);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ana..souza@exemplo.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));

    expect(screen.getByText("Informe um endereço de email válido.")).toBeInTheDocument();
    expect(window.alert).toHaveBeenCalledWith(
      "Erro de validação: Informe um endereço de email válido."
    );
  });

  it("valida que todos os campos são preenchidos antes de salvar", async () => {
    render(<UserManagement />);
    fireEvent.click((await screen.findAllByRole("button", { name: /Editar usuário/ }))[0]);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Setor"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Nível de Acesso"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));

    expect(screen.getByText("Informe o nome do usuário.")).toBeInTheDocument();
    expect(screen.getByText("Informe o email do usuário.")).toBeInTheDocument();
    expect(screen.getByText("Selecione um setor.")).toBeInTheDocument();
    expect(screen.getByText("Selecione um nível de acesso.")).toBeInTheDocument();
    expect(window.alert).toHaveBeenCalledWith(
      "Erro de validação: Informe o nome do usuário. Informe o email do usuário. Selecione um setor. Selecione um nível de acesso."
    );
  });

  it("valida setores e níveis inválidos e limpa o erro ao alterar o campo", async () => {
    render(<UserManagement />);
    fireEvent.click((await screen.findAllByRole("button", { name: /Editar usuário/ }))[0]);
    const sector = screen.getByLabelText("Setor");
    const accessLevel = screen.getByLabelText("Nível de Acesso");
    sector.add(new Option("Inválido", "Inválido"));
    accessLevel.add(new Option("Inválido", "Inválido"));
    fireEvent.change(sector, { target: { value: "Inválido" } });
    fireEvent.change(accessLevel, { target: { value: "Inválido" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));

    expect(screen.getByText("Selecione um setor válido.")).toBeInTheDocument();
    expect(screen.getByText("Selecione um nível de acesso válido.")).toBeInTheDocument();
    expect(updateManagedUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Setor"), { target: { value: "Técnico" } });
    expect(screen.queryByText("Selecione um setor válido.")).not.toBeInTheDocument();
    expect(screen.getByText("Selecione um nível de acesso válido.")).toBeInTheDocument();
  });

  it("salva mock validado, exibe os novos dados e atualiza o cartão", async () => {
    render(<UserManagement />);
    fireEvent.click((await screen.findAllByRole("button", { name: /Editar usuário/ }))[0]);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: " Ana Souza " } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: " ana@exemplo.com " } });
    fireEvent.change(screen.getByLabelText("Setor"), { target: { value: "Jurídico" } });
    fireEvent.change(screen.getByLabelText("Nível de Acesso"), { target: { value: "Comercial" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));

    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeInTheDocument());
    expect(screen.getByText("ana@exemplo.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Usuário atualizado" })).toBeInTheDocument();
    expect(updateManagedUser).toHaveBeenCalledWith(1, {
      nome: "Ana Souza",
      email: "ana@exemplo.com",
      setor: "Jurídico",
      nivel_acesso: "Comercial",
    });
  });

  it.each([
    ["erro detalhado", { response: { data: { erro: "Falha específica ao salvar." } } }, "Falha específica ao salvar."],
    ["detalhe alternativo", { response: { data: { detail: "Atualização recusada." } } }, "Atualização recusada."],
    ["mensagem padrão", new Error("offline"), "Não foi possível salvar as alterações. Tente novamente."],
  ])("exibe a mensagem adequada quando o salvamento falha (%s)", async (_case, error, message) => {
    updateManagedUser.mockRejectedValueOnce(error);
    render(<UserManagement />);
    fireEvent.click((await screen.findAllByRole("button", { name: /Editar usuário/ }))[0]);
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));

    expect(await screen.findByRole("heading", { name: "Falha ao atualizar usuário" })).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Editar Usuário" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("fecha a edição ao clicar fora dela, mas não ao clicar dentro", async () => {
    render(<UserManagement />);
    fireEvent.click((await screen.findAllByRole("button", { name: /Editar usuário/ }))[0]);

    const form = screen.getByRole("heading", { name: "Editar Usuário" }).closest("form");
    fireEvent.mouseDown(form);
    expect(screen.getByRole("heading", { name: "Editar Usuário" })).toBeInTheDocument();
    fireEvent.mouseDown(form.parentElement);
    expect(screen.queryByRole("heading", { name: "Editar Usuário" })).not.toBeInTheDocument();
  });
});