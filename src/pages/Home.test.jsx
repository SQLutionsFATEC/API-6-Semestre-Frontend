import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./Home";

describe("Home", () => {
  it("renderiza a página de documentos", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Documentos" }),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Pesquisar documentos..."),
    ).toBeInTheDocument();
  });

  it("renderiza os documentos da primeira página", () => {
    render(<Home />);

    expect(
      screen.getByText(
        "DEPARTMENT OF DEFENSE HANDBOOK: METALLIC MATERIALS AND ELEMENTS FOR AEROSPACE VEHICLE STRUCTURES",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "SPECIFICATION FOR MANUFACTURERS' TECHNICAL DATA AND AIRCRAFT DOCUMENTATION",
      ),
    ).toBeInTheDocument();
  });

  it("filtra documentos pelo nome", () => {
    render(<Home />);

    const input = screen.getByPlaceholderText(
      "Pesquisar documentos...",
    );

    fireEvent.change(input, {
      target: {
        value: "STRUCTURAL",
      },
    });

    expect(
      screen.getByText(
        "STRUCTURAL DESIGN AND TEST FACTORS OF SAFETY FOR SPACEFLIGHT HARDWARE",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "DEPARTMENT OF DEFENSE HANDBOOK: METALLIC MATERIALS AND ELEMENTS FOR AEROSPACE VEHICLE STRUCTURES",
      ),
    ).not.toBeInTheDocument();
  });

  it("abre o modal ao clicar em Visualizar", () => {
    render(<Home />);

    const buttons = screen.getAllByRole("button", {
      name: /visualizar/i,
    });

    fireEvent.click(buttons[0]);

    expect(
      screen.getByText("Código da norma"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("MIL-HDBK-5J"),
    ).toBeInTheDocument();
  });

  it("fecha o modal ao clicar em Fechar", () => {
    render(<Home />);

    const buttons = screen.getAllByRole("button", {
      name: /visualizar/i,
    });

    fireEvent.click(buttons[0]);

    fireEvent.click(
      screen.getByRole("button", { name: "Fechar" }),
    );

    expect(
      screen.queryByText("Código da norma"),
    ).not.toBeInTheDocument();
  });

  it("abre a segunda página", () => {
    render(<Home />);

    fireEvent.click(
      screen.getByRole("button", { name: "2" }),
    );

    expect(
      screen.getByText(
        "DESIGN ASSURANCE GUIDANCE FOR AIRBORNE ELECTRONIC HARDWARE",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "DEPARTMENT OF DEFENSE HANDBOOK: METALLIC MATERIALS AND ELEMENTS FOR AEROSPACE VEHICLE STRUCTURES",
      ),
    ).not.toBeInTheDocument();
  });
});