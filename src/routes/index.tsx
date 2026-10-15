import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Theological Repository — Dean of Theological Studies, Cape Town" },
      { name: "description", content: "Clergy of the Anglican Diocese of Cape Town register, acknowledge POPIA, and submit theological documents and ideas to the Dean." },
      { property: "og:title", content: "Theological Repository — Anglican Diocese of Cape Town" },
      { property: "og:description", content: "A secure place for clergy to submit documents and ideas to the Dean of Theological Studies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  ["Register", "Create your clergy account with your title, parish and contact details."],
  ["Acknowledge POPIA", "Read and accept how your personal information is processed before any access is granted."],
  ["Submit", "Upload sermons, papers, liturgical resources, or share ideas with the Dean."],
  ["Review & share", "The Dean reviews each submission; accepted works join the repository for fellow clergy."],
];

function Index() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20">
        <p className="text-sm uppercase tracking-[0.25em] text-gold">Office of the Dean of Theological Studies</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight text-primary md:text-6xl">
          A repository for the theological work of our clergy
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Preserve and share sermons, research, liturgical writing and new ideas across the Anglican Diocese of Cape Town — with care for every contributor's privacy under POPIA.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to="/auth">Register as clergy</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/repository">Browse the repository</Link></Button>
        </div>
      </section>
      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-4">
          {steps.map(([t, d], i) => (
            <div key={t}>
              <div className="font-serif text-4xl text-gold">{["I", "II", "III", "IV"][i]}</div>
              <h3 className="mt-2 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground">
        Personal information is processed in accordance with the Protection of Personal Information Act 4 of 2013.
      </footer>
    </main>
  );
}
