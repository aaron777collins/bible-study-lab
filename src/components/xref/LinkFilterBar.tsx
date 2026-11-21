import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BOOKS } from "@/lib/canon/books";
import type { LinkFilter } from "@/lib/xref/links";

const MIN_STEPS = [1, 5, 10, 20, 50];

export function LinkFilterBar({ value, onChange, groupBy, onGroupBy, compact = false }: { value: LinkFilter; onChange: (f: LinkFilter) => void; groupBy?: boolean; onGroupBy?: (g: boolean) => void; compact?: boolean }) {
  return (
    <div className={`grid gap-3 ${compact ? "text-sm" : ""}`}>
      <div className="grid gap-1.5">
        <Label id="min-votes">Strength (votes)</Label>
        <ToggleGroup type="single" variant="outline" size="sm" value={String(value.minVotes)} onValueChange={(v) => v && onChange({ ...value, minVotes: Number(v) })} aria-labelledby="min-votes" className="flex-wrap justify-start">
          {MIN_STEPS.map((n) => (
            <ToggleGroupItem key={n} value={String(n)} aria-label={n === 1 ? "Any strength" : `${n} or more votes`}>
              {n === 1 ? "Any" : `${n}+`}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-3">
        <div className="grid gap-1.5">
          <Label id="testament-filter">Testament</Label>
          <ToggleGroup type="single" variant="outline" size="sm" value={value.testament} onValueChange={(v) => v && onChange({ ...value, testament: v as LinkFilter["testament"] })} aria-labelledby="testament-filter">
            <ToggleGroupItem value="all">Both</ToggleGroupItem>
            <ToggleGroupItem value="ot">Old</ToggleGroupItem>
            <ToggleGroupItem value="nt">New</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="grid gap-1.5">
          <Label id="direction-filter">Direction</Label>
          <ToggleGroup type="single" variant="outline" size="sm" value={value.direction} onValueChange={(v) => v && onChange({ ...value, direction: v as LinkFilter["direction"] })} aria-labelledby="direction-filter">
            <ToggleGroupItem value="both">Both</ToggleGroupItem>
            <ToggleGroupItem value="out" aria-label="Links from this verse">From</ToggleGroupItem>
            <ToggleGroupItem value="in" aria-label="Links to this verse, referenced by">To</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="grid gap-1.5">
          <Label>Books</Label>
          <BookFilter value={value.books} onChange={(books) => onChange({ ...value, books })} />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <Switch id="disputed" checked={value.showDisputed} onCheckedChange={(v) => onChange({ ...value, showDisputed: v })} />
          <Label htmlFor="disputed">Show disputed links</Label>
        </div>
        {onGroupBy && (
          <div className="flex items-center gap-2">
            <Switch id="group-book" checked={!!groupBy} onCheckedChange={onGroupBy} />
            <Label htmlFor="group-book">Group by book</Label>
          </div>
        )}
      </div>
    </div>
  );
}

export function BookFilter({ value, onChange }: { value: number[]; onChange: (b: number[]) => void }) {
  const toggle = (i: number) => onChange(value.includes(i) ? value.filter((x) => x !== i) : [...value, i].sort((a, b) => a - b));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="justify-between gap-2">
          {value.length === 0 ? "All books" : value.length === 1 ? BOOKS[value[0]].name : `${value.length} books`}
          <ChevronDown aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-80 w-72 overflow-y-auto">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Choose books</span>
          <Button size="xs" variant="ghost" onClick={() => onChange([])} disabled={value.length === 0}>
            Clear
          </Button>
        </div>
        <ul className="grid grid-cols-2 gap-x-2">
          {BOOKS.map((b, i) => (
            <li key={b.osis} className="flex items-center gap-2 py-1">
              <Checkbox id={`bf-${b.osis}`} checked={value.includes(i)} onCheckedChange={() => toggle(i)} />
              <Label htmlFor={`bf-${b.osis}`} className="text-sm font-normal">{b.short}</Label>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
