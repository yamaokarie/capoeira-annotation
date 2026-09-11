export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="chip"
      onClick={onClick}
      style={{
        width: "100%",
        height: "var(--height-chip-lg)",
        boxSizing: "border-box",
        borderRadius: "var(--radius-pill)",
        backgroundColor: selected ? "var(--cream)" : "transparent",
        color: selected ? "var(--ink)" : "var(--on-dark)",
        border: `1px solid ${selected ? "var(--ink)" : "var(--hairline-strong)"}`,
        fontWeight: selected ? 600 : 500,
        cursor: "pointer",
        fontSize: "16px",
        padding: "0 20px",
      }}
    >
      {label}
    </button>
  );
}
