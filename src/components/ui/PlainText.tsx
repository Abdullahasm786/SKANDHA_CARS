/** Renders owner-entered text as paragraphs (no HTML/markdown is interpreted, so it is safe by construction). */
export function PlainText({ text }: { text: string }) {
  return <div className="prose-sc">{text.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</div>;
}
