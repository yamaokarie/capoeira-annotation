export function TextInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <input
      className="text-input"
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        minHeight: "var(--height-input)",
        padding: "12px 16px",
        borderRadius: "8px",
        border: "1px solid var(--soft)",
        fontSize: "14px",
        fontFamily: "var(--font-body)",
      }}
    />
  );
}
