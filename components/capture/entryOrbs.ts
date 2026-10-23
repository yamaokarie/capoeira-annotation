// Slower, subtler than the shared GradientOrbs used on capture screens —
// this entry screen's spec calls for 44-60s drift and .20-.30 opacity.
// Positions are fixed px insets from each corner (computed off the
// 412x880 mobile/centered-card reference) rather than percentages of the
// container: .svs-orbs spans the full page at desktop (>=1024px), and a
// percentage-of-width offset there pushed every orb hundreds of px past
// the visible edge instead of just past a phone-sized corner.
export const ENTRY_ORBS = [
  { color: "var(--orb-mint)", top: "-70px", left: "-74px", size: "240px", duration: "52s", delay: "0s", opacity: 0.28 },
  { color: "var(--orb-lavender)", top: "53px", right: "-91px", size: "260px", duration: "58s", delay: "-16s", opacity: 0.22 },
  { color: "var(--orb-peach)", bottom: "176px", left: "-66px", size: "220px", duration: "48s", delay: "-30s", opacity: 0.3 },
  { color: "var(--orb-sky)", bottom: "-106px", right: "-58px", size: "230px", duration: "60s", delay: "-42s", opacity: 0.24 },
] as const;
