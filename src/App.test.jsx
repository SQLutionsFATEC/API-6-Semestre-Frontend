import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { keycloak } from "./services/keycloak";

vi.mock("./services/keycloak", () => ({
  keycloak: {
    tokenParsed: null,
  },
}));

vi.mock("./components/Layout/Layout", () => ({
  default: ({ children, isOperator, activePage, onNavigate, onDocumentCreated }) => (
    <div>
      <output data-testid="layout-state">
        {JSON.stringify({ isOperator, activePage })}
      </output>
      <button type="button" onClick={() => onNavigate("requests")}>
        Ir para solicitações
      </button>
      <button type="button" onClick={onDocumentCreated}>
        Documento criado
      </button>
      {children}
    </div>
  ),
}));

vi.mock("./pages/Home/Home", () => ({
  default: ({ documentsRefreshKey }) => (
    <p>Página de documentos: {documentsRefreshKey}</p>
  ),
}));

vi.mock("./pages/AccessRequests/AccessRequests", () => ({
  default: () => <p>Página de solicitações</p>,
}));

describe("App", () => {
  beforeEach(() => {
    keycloak.tokenParsed = null;
  });

  it("reconhece operador pelas roles do realm e permite abrir solicitações", () => {
    keycloak.tokenParsed = {
      realm_access: { roles: ["OPÉRADOR"] },
      resource_access: {},
    };

    render(<App />);

    expect(screen.getByTestId("layout-state")).toHaveTextContent(
      JSON.stringify({ isOperator: true, activePage: "documents" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Ir para solicitações" }));
    expect(screen.getByText("Página de solicitações")).toBeInTheDocument();
  });

  it("reconhece operador nas roles de cliente", () => {
    keycloak.tokenParsed = {
      resource_access: {
        frontend: { roles: ["operator"] },
        outro: { roles: ["usuario"] },
      },
    };

    render(<App />);

    expect(screen.getByTestId("layout-state")).toHaveTextContent(
      JSON.stringify({ isOperator: true, activePage: "documents" })
    );
  });

  it("impede que não operadores acessem a página de solicitações", () => {
    keycloak.tokenParsed = {
      realm_access: { roles: ["usuario"] },
      resource_access: {},
    };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Ir para solicitações" }));

    expect(screen.queryByText("Página de solicitações")).not.toBeInTheDocument();
    expect(screen.getByText("Página de documentos: 0")).toBeInTheDocument();
    expect(screen.getByTestId("layout-state")).toHaveTextContent(
      JSON.stringify({ isOperator: false, activePage: "documents" })
    );
  });

  it("atualiza a chave de documentos quando um documento é criado", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Documento criado" }));

    expect(screen.getByText("Página de documentos: 1")).toBeInTheDocument();
  });
});
