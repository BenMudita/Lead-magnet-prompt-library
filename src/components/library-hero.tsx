import { quickFilters } from "@/lib/library";
import { QuickFilterChips } from "./quick-filter-chips";
import { SearchBar } from "./search-bar";

type LibraryHeroProps = {
  totalPrompts: number;
  testedPrompts: number;
};

export function LibraryHero({
  totalPrompts,
  testedPrompts,
}: LibraryHeroProps) {
  return (
    <section className="product-hero search-hero">
      <div className="hero-copy">
        <p className="eyebrow">The Mudita Prompt Library</p>
        <h1>Find the right AI prompt for the work you&apos;re doing.</h1>
        <p>Browse tested prompts by role, industry, or task. Open one, preview what it does, and copy it into ChatGPT or Claude.</p>
        <SearchBar
          large
          label="What are you trying to do?"
          placeholder="Search by task, role, or outcome..."
          helperText="Try investor update, sales follow-up, content calendar, or meeting summary."
        />
        <QuickFilterChips filters={quickFilters} />
      </div>
      <div className="hero-proof" aria-label="Library status">
        <span>{totalPrompts} ready-to-use prompts</span>
        <span>Free account required to copy</span>
        <span>{testedPrompts} Mudita-tested</span>
      </div>
    </section>
  );
}
