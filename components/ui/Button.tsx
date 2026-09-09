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
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: "50px",
        borderRadius: "var(--radius-pill)",
        backgroundColor: disabled ? "var(--soft)" : "var(--canvas)",
        color: "var(--ink)",
        border: "1px solid var(--ink)",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "16px",
      }}
    >
      {children}
    </button>
  );
}
