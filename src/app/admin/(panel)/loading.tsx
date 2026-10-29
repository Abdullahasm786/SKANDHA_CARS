export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton mb-6 h-9 w-64" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-[74px]" />)}</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]"><div className="skeleton h-72" /><div className="skeleton h-72" /></div>
    </div>
  );
}
