import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import UserMenu from "./UserMenu";

const user = { name: "Nome do usuário" };

function renderMenu(overrides = {}) {
  const props = {
    user,
    onOpenProfile: vi.fn(),
    onOpenConsent: vi.fn(),
    ...overrides,
  };

  render(<UserMenu {...props} />);

  return props;
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Abrir menu do usuário" }));
}

describe("UserMenu", () => {
  it("exibe o nome do usuário no botão de informação", () => {
    renderMenu();

    expect(
      screen.getByRole("button", { name: "Abrir menu do usuário" })
    ).toHaveTextContent("Nome do usuário");
  });

  it("mantém o dropdown fechado inicialmente", () => {
    renderMenu();

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Abrir menu do usuário" })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("abre o dropdown com as opções Meus dados e Consentimento", () => {
    renderMenu();

    openMenu();

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Meus dados" })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Consentimento" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Abrir menu do usuário" })
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("aciona a abertura do perfil e fecha o dropdown", () => {
    const props = renderMenu();

    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Meus dados" }));

    expect(props.onOpenProfile).toHaveBeenCalledTimes(1);
    expect(props.onOpenConsent).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("aciona a abertura dos consentimentos e fecha o dropdown", () => {
    const props = renderMenu();

    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Consentimento" }));

    expect(props.onOpenConsent).toHaveBeenCalledTimes(1);
    expect(props.onOpenProfile).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("fecha o dropdown ao pressionar Escape", () => {
    renderMenu();

    openMenu();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("fecha o dropdown ao clicar fora dele", () => {
    renderMenu();

    openMenu();
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
