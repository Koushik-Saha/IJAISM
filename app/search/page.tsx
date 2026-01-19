import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
      <Suspense fallback={<div className="p-6">Loading search…</div>}>
        <SearchClient />
      </Suspense>
  );
}
