import type { Metadata } from "next";
import { ENTRY_ORBS } from "@/components/capture/entryOrbs";
import { safeNext } from "@/lib/access";

export const metadata: Metadata = {
  title: "Capoeira Annotation · Sign in",
};

const ERRORS: Record<string, string> = {
  wrong: "That password didn’t work.",
  wait: "Too many tries. Wait a few minutes and try again.",
};

// Same dark card, orbs and type as the entry screen (SelectVideoScreen),
// reusing its svs-* classes. A plain form POST to /api/login, so it works
// before any JS loads.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  const isStudent = next?.startsWith("/student") ?? false;

  return (
    <div className="svs-page">
      <div className="svs-card">
        <div aria-hidden className="svs-orbs">
          {ENTRY_ORBS.map((orb, i) => (
            <div
              key={i}
              className="svs-orb"
              style={{
                top: "top" in orb ? orb.top : undefined,
                bottom: "bottom" in orb ? orb.bottom : undefined,
                left: "left" in orb ? orb.left : undefined,
                right: "right" in orb ? orb.right : undefined,
                width: orb.size,
                height: orb.size,
                background: orb.color,
                opacity: orb.opacity,
                animationDuration: orb.duration,
                animationDelay: orb.delay,
              }}
            />
          ))}
        </div>

        <div className="svs-content svs-gate">
          <div className="svs-header">
            <div className="svs-kicker">
              Capoeira &middot; {isStudent ? "Student Rodas" : "Moment Capture"}
            </div>
            <h1 className="svs-headline">
              Come
              <br />
              on in
            </h1>
            <p className="svs-subhead">Enter the password you were given to start annotating.</p>
          </div>

          <form method="post" action="/api/login" className="svs-gate-form">
            {next && <input type="hidden" name="next" value={next} />}
            <label className="svs-section-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="svs-name-input svs-gate-input"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              autoFocus
            />
            {error && <p className="svs-status-message svs-status-error">{error}</p>}
            <button type="submit" className="svs-gate-submit">
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
