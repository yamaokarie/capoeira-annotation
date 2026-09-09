export const OFFER_TYPES = [
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
      "A declared possibility of attack, real or fake — forces the other to respond",
  },
  {
    label: "Redirection",
    value: "redirection",
    definition: "Ignored the offer, started something new",
  },
  {
    label: "Pressure",
    value: "pressure",
    definition: "Closing space, limiting options, forcing a reaction",
  },
] as const;

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

export const YES_NO = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
] as const;
