import { fetchCards } from "./actions";
import { RoadmapView } from "./roadmap-view";

export default async function AdminRoadmapPage() {
  let cards;
  try {
    cards = await fetchCards();
  } catch {
    return (
      <div className="rounded-ds-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Configure <code className="rounded bg-white/60 px-1">SUPABASE_SERVICE_ROLE_KEY</code> para
        carregar o roadmap.
      </div>
    );
  }

  return <RoadmapView cards={cards} />;
}
