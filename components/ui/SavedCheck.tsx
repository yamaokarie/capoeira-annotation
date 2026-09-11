import styles from "./SavedCheck.module.css";

// Animated success checkmark for the Done screen. CSS-only (no animation
// library) — ring and disc scale/fade in, then the check draws itself via
// stroke-dashoffset and pops slightly as it lands.
export function SavedCheck() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.ring} />
      <div className={styles.disc} />
      <div className={styles.checkWrap}>
        <svg viewBox="0 0 44 44" width="48" height="48">
          <polyline points="6,23 17,34 37,10" className={styles.checkStroke} />
        </svg>
      </div>
    </div>
  );
}
