import { Link } from "react-router";
import { Page } from "@/components/Page";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const SOURCES: { name: string; use: string; license: string; href: string; note?: string }[] = [
  { name: "King James Version (1769 text, with Strong's numbers)", use: "Bible text, red letters, original word study", license: "Public domain", href: "https://ebible.org/find/details.php?id=eng-kjv2006", note: "Outside the United Kingdom. In the UK the Crown holds letters patent over printing." },
  { name: "World English Bible", use: "Bible text, red letters, footnotes", license: "Public domain", href: "https://ebible.org/find/details.php?id=engwebp", note: "\"World English Bible\" is a trademark. The text is not changed here." },
  { name: "American Standard Version (1901)", use: "Bible text", license: "Public domain", href: "https://ebible.org/find/details.php?id=eng-asv" },
  { name: "Young's Literal Translation", use: "Bible text", license: "Public domain", href: "https://ebible.org/find/details.php?id=engylt" },
  { name: "OpenBible.info cross references", use: "About 345,000 cross references with reader votes: the connections, arcs, paths and insights", license: "Creative Commons Attribution 4.0", href: "https://www.openbible.info/labs/cross-references/", note: "Mostly drawn from the public domain Treasury of Scripture Knowledge, with votes from OpenBible.info readers." },
  { name: "OpenBible.info topical Bible scores", use: "Topics and the verse of the day", license: "Creative Commons Attribution 4.0", href: "https://www.openbible.info/topics/" },
  { name: "Strong's dictionaries, Open Scriptures edition", use: "Hebrew and Greek word study", license: "Creative Commons Attribution-ShareAlike (the underlying Strong's text of 1890 and 1894 is public domain)", href: "https://github.com/openscriptures/strongs", note: "The dictionary files in this app are shared under the same license. Prepared by Ulrik Petersen, David Troidl and others." },
  { name: "M'Cheyne reading calendar (1842)", use: "One of the reading plans", license: "Public domain", href: "https://en.wikipedia.org/wiki/Robert_Murray_M%27Cheyne" },
  { name: "Gentium Book Plus, Atkinson Hyperlegible Next, Noto Serif Hebrew", use: "Fonts, bundled with the app", license: "SIL Open Font License", href: "https://openfontlicense.org/" },
];

export function Component() {
  useDocumentTitle("About and data sources");
  return (
    <Page title="About Bible Study Lab" intro="A free, private way to read the Bible, see how Scripture connects, and keep your own notes. It is for anyone who wants to learn, share and grow.">
      <div className="grid gap-8">
        <section aria-label="Privacy">
          <h2 className="mb-2 text-xl">Private by design</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>No accounts, no tracking, no cookies and no ads. Nothing you read or write is sent anywhere.</li>
            <li>Your notes, highlights, bookmarks and progress are saved in this browser only. They can be lost if you clear browsing data, use a private window or switch devices, so <Link to="/notes?tab=backup">export a copy</Link> now and then.</li>
            <li>The app is a set of static files. It works offline after the first visit.</li>
            <li>Verse cards and shared links are made on your device. A shared collection is stored inside the link itself.</li>
          </ul>
        </section>

        <section aria-label="Data sources">
          <h2 className="mb-2 text-xl">Data sources and licenses</h2>
          <p className="mb-3 text-muted-foreground">Only public domain or openly licensed material is used. Each source is listed with its license.</p>
          <ul className="grid gap-3">
            {SOURCES.map((s) => (
              <li key={s.name} className="rounded-md border bg-surface p-3">
                <p className="font-semibold"><a href={s.href} rel="noreferrer">{s.name}</a></p>
                <p className="text-sm">{s.use}</p>
                <p className="text-sm text-muted-foreground">License: {s.license}.{s.note ? ` ${s.note}` : ""}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">The book overviews, study prompts and help text were written for this app and are shared under Creative Commons Attribution 4.0. The app code is MIT licensed, except the Strong&rsquo;s dictionary files, which are CC BY-SA. The full list with file hashes is in DATA.md in the <a href="https://github.com/aaron777collins/bible-study-lab" rel="noreferrer">source code</a>.</p>
        </section>

        <section aria-label="Credits">
          <h2 className="mb-2 text-xl">Credits and thanks</h2>
          <p>Cross references and topics: OpenBible.info, licensed CC BY 4.0. Bible texts: eBible.org and the translators who gave their work to the public domain. Strong&rsquo;s numbers: James Strong and the Open Scriptures community. The arc view is inspired by the 2007 cross reference arc diagram by Chris Harrison and Christoph R&ouml;mhild, drawn here from fresh data.</p>
        </section>

        <section aria-label="A word about interpretation">
          <h2 className="mb-2 text-xl">A word about interpretation</h2>
          <p>This app shows Scripture and the connections between passages. It does not tell you what to believe. Where authorship, dates or meaning are debated, the overviews say so. Read the text, read it with others, and test everything against it.</p>
        </section>
      </div>
    </Page>
  );
}
