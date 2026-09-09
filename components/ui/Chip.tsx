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
      onClick={onClick}
      style={{
        height: "var(--height-chip)",
        borderRadius: "var(--radius-pill)",
        backgroundColor: selected ? "var(--cream)" : "transparent",
        color: selected ? "var(--ink)" : "var(--on-dark)",
        border: `1px solid ${selected ? "var(--ink)" : "var(--hairline-strong)"}`,
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        fontSize: "14px",
        padding: "0 16px",
      }}
    >
      {label}
    </button>
  );
}
