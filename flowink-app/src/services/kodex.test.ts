import { describe, expect, it } from "vitest";

import { createKodexDeck, interpretKodexCommand } from "./kodex";

describe("Kodex presentation agent", () => {
  it("understands deck creation in Spanish", () => {
    expect(
      interpretKodexCommand(
        "Crea una presentación de 6 diapositivas sobre arquitectura MCP",
      ),
    ).toEqual({
      type: "create-deck",
      topic: "arquitectura MCP",
      count: 6,
    });
  });

  it("understands real-time editing commands", () => {
    expect(interpretKodexCommand("agrega una terminal")).toEqual({
      type: "insert-block",
      preset: "terminal",
    });
    expect(interpretKodexCommand("usa la transición smart")).toEqual({
      type: "set-transition",
      transition: "smart",
    });
    expect(interpretKodexCommand("cambia al modo oscuro")).toEqual({
      type: "set-theme",
      theme: "dark",
    });
    expect(
      interpretKodexCommand('renombra la diapositiva a "Arquitectura"'),
    ).toEqual({
      type: "rename-slide",
      name: "Arquitectura",
    });
  });

  it("builds a valid visual deck", () => {
    const deck = createKodexDeck("MCP", 5);

    expect(deck.metadata.title).toBe("MCP");
    expect(deck.slides).toHaveLength(5);
    expect(deck.slides.every((slide) => slide.scene.elements.length > 0)).toBe(
      true,
    );
    expect(
      deck.slides.every(
        (slide) => slide.scene.appState.viewBackgroundColor === "#0b100d",
      ),
    ).toBe(true);
  });
});
