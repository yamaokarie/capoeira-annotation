export function PillButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="pill-button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: "var(--height-button)",
        borderRadius: "var(--radius-pill)",
        backgroundColor: disabled ? "var(--soft)" : "var(--canvas)",
        color: "var(--ink)",
        border: "1px solid var(--ink)",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "16px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      {children}
    </button>
  );
}
