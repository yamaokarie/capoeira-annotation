// Canonical wording from capoeira_schema_mvp.txt's TAGS (Multi-Select) section.
export const TAGS = [
  {
    label: "Invitation",
    value: "invitation",
    definition:
      "Opening the body to provoke a response — an offer that is also a trap",
  },
  {
    label: "Threat",
    value: "threat",
    definition:
      "Declared possibility of attack, real or fake — forces response",
  },
  {
    label: "Redirection",
    value: "redirection",
    definition: "Unexpected pivot — broke expectation or pattern",
  },
  {
    label: "Pressure",
    value: "pressure",
    definition: "Closing space, limiting options, forcing reaction",
  },
  {
    label: "Deceptive",
    value: "deceptive",
    definition: "Cunning, malícia — reading and outsmarting the other player",
  },
  {
    label: "Skillful",
    value: "skillful",
    definition: "Clean, precise, well-timed execution",
  },
  {
    label: "Collaborative",
    value: "collaborative",
    definition: "Playful, non-combative, mutual exploration",
  },
  {
    label: "Playful",
    value: "playful",
    definition: "Lightness, humor, ease — jogo became play",
  },
] as const;

export type TagValue = (typeof TAGS)[number]["value"];

export const ENDING_TYPES = [
  {
    label: "Clean Break",
    value: "clean break",
    definition: "Both players acknowledge a definitive end",
  },
  {
    label: "Reset",
    value: "reset",
    definition: "Dissolves back into ginga, no clear conclusion",
  },
  {
    label: "Takedown",
    value: "takedown",
    definition: "Someone went to the ground",
  },
  {
    label: "Laughter",
    value: "laughter",
    definition: "The tension became play",
  },
] as const;

export type EndingType = (typeof ENDING_TYPES)[number]["value"];
