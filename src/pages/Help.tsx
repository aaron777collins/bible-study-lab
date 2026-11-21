import { Page } from "@/components/Page";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const KEYS: [string, string][] = [
  ["Ctrl K or Cmd K", "Search, or go to a verse such as John 3:16"],
  ["/", "Open the search and go box"],
  ["j and k", "Next and previous verse in the reader"],
  ["[ and ]", "Previous and next chapter"],
  ["x", "Show the selected verse's cross references"],
  ["n", "Add a note to the selected verse"],
  ["h or b", "Open notes to highlight or bookmark"],
  ["c", "Copy the selected verse with its reference"],
  ["Shift and click", "Select a range of verses"],
  ["Esc", "Clear the selection"],
  ["Arrow keys", "Move between verses and between books in the arc view"],
];

export function Component() {
  useDocumentTitle("Help and keyboard shortcuts");
  return (
    <Page title="Help" intro="A short guide to getting the most from Bible Study Lab.">
      <div className="grid gap-8">
        <section aria-label="Getting started">
          <h2 className="mb-2 text-xl">Getting started</h2>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Open <strong>Read</strong> and pick a book and chapter. A good first book is John.</li>
            <li>Tap a verse. A panel opens with its cross references, your notes, the original words, and ways to share it.</li>
            <li>In <strong>Links</strong>, stronger links are shown first. Tap one to jump to that verse, or choose &ldquo;Connections from here&rdquo; to keep exploring.</li>
            <li>Use <strong>Compare</strong> to read the same chapter in two or three translations side by side.</li>
            <li>Try <strong>Explore</strong> to see how the whole Bible connects, and <strong>Insights</strong> to see which verses and books are most connected.</li>
          </ol>
        </section>
        <section aria-label="Your notes">
          <h2 className="mb-2 text-xl">Where your notes live</h2>
          <p>Notes, highlights, bookmarks and reading progress are saved in this browser on this device. There is no account and no server, which is why nothing about you leaves your device. It also means they can be lost if you clear browsing data, use a private window, or switch to another device.</p>
          <p className="mt-2"><strong>Export your notes</strong> from the Notes page to download a file. To move to a new device or recover, choose <strong>Import notes</strong> and pick that file. You can merge it with what is already there or replace it.</p>
        </section>
        <section aria-label="Sharing">
          <h2 className="mb-2 text-xl">Sharing</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Copy</strong> a verse with its reference, with verse numbers, or as a Markdown quote.</li>
            <li><strong>Share a link</strong> to the exact verses, translation and view you are looking at.</li>
            <li><strong>Make a verse card</strong>: a picture you can post or send, drawn on your device.</li>
            <li><strong>Collections</strong> gather passages into one link. A small group leader can send a week of readings as a single link.</li>
            <li><strong>Printable study sheet</strong>: the passage, its cross references, your notes, and space to write.</li>
          </ul>
        </section>
        <section aria-label="Keyboard shortcuts">
          <h2 className="mb-2 text-xl">Keyboard shortcuts</h2>
          <table className="w-full max-w-2xl text-left text-sm">
            <thead><tr className="border-b"><th className="py-2 pr-4">Keys</th><th className="py-2">What they do</th></tr></thead>
            <tbody>{KEYS.map(([k, v]) => <tr key={k} className="border-b last:border-0"><td className="py-2 pr-4"><kbd className="rounded border bg-wash px-1.5 py-0.5">{k}</kbd></td><td className="py-2">{v}</td></tr>)}</tbody>
          </table>
        </section>
        <section aria-label="How strength is shown">
          <h2 className="mb-2 text-xl">How cross reference strength works</h2>
          <p>Each cross reference has votes from OpenBible.info readers. Strong means 20 or more votes, Medium is 5 to 19, and Light is 1 to 4. Links with zero or negative votes are disputed and are hidden unless you turn them on. Strength is always written as a word as well as shown as a bar.</p>
        </section>
      </div>
    </Page>
  );
}
