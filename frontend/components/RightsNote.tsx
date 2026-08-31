/**
 * Rights statement shown beneath image-heavy sections.
 *
 * Every photograph on this site is used under a free licence, and the author
 * and licence are named on the image itself. Copyright in each photograph still
 * belongs to its author — a free licence grants permission, it does not
 * transfer ownership — and that is what this note records, alongside the
 * separate point that team names, liveries and trademarks belong to their
 * owners.
 */
export default function RightsNote({ className = '' }: { className?: string }) {
  return (
    <aside className={`border-t border-line pt-5 ${className}`}>
      <p className="max-w-3xl font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted">
        <span className="mr-2 border border-line px-1 py-px text-[8px] text-silver">RIGHTS</span>
        Copyright in each photograph remains with its author, credited beneath the image and used
        here under the free licence stated there. Car liveries, team names, sponsor marks and the
        Formula 1 word mark are the property of their respective owners. This is an independent
        editorial project with no affiliation to Formula 1, the FIA or any team.
      </p>
    </aside>
  );
}
