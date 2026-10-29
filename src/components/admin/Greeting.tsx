"use client";

/** Rendered in the viewer's own timezone, so it can legitimately differ from the server render. */
export function Greeting({ name }: { name: string }) {
  const now = new Date();
  const h = now.getHours();
  const part = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return (
    <>
      <span suppressHydrationWarning>Good {part}, {name}</span>
    </>
  );
}

export function TodayDate() {
  return <span suppressHydrationWarning>{new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</span>;
}
