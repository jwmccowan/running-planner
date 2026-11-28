import Link from "next/link";
import type { Metadata } from "next";
import { config } from "@/lib/config";

export const metadata: Metadata = { title: "How it works · Running Planner" };

const low = config.acuteRangeLow;
const high = config.acuteRangeHigh;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4">
      <h2 className="text-base font-semibold text-zinc-900 mb-1">{title}</h2>
      <div className="text-sm text-zinc-700 leading-relaxed flex flex-col gap-2">{children}</div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Running Planner
      </Link>
      <h1 className="text-xl font-bold mt-1 mb-2">How it works</h1>
      <p className="text-sm text-zinc-700 leading-relaxed mb-4">
        Running Planner lays out your training week by week and shows how each week&apos;s load compares
        with your recent running, so you can build up gradually.
      </p>

      <div className="text-sm border border-amber-200 bg-amber-50 rounded p-3 mb-6 text-amber-900">
        The thresholds below are the app&apos;s defaults, based on common rules of thumb. They aren&apos;t
        medical or coaching advice. If you&apos;re injured or unsure, talk to a professional.
      </div>

      <div className="flex flex-col gap-6">
        <Section id="acute" title="Acute distance">
          <p>
            This week&apos;s planned running distance. Gym sessions and runs marked missed don&apos;t count.
          </p>
        </Section>

        <Section id="chronic" title="Chronic distance">
          <p>
            {`Your average weekly distance over the previous ${config.chronicWeeks} weeks: roughly what you're used to. Prior weeks count too.`}
          </p>
          <p>
            {`With fewer than ${config.chronicWeeks} weeks of history it averages what's there and says how many weeks, e.g. “(2 wks)”. With none, it shows “—”.`}
          </p>
        </Section>

        <Section id="range" title="Ideal acute range">
          <p>
            {`By default, ${low}–${high}× your chronic distance. Staying inside it means changing your load gradually rather than in big jumps. Acute distance is green inside the range and red outside it.`}
          </p>
          <p>
            The range comes from the acute:chronic workload ratio, a popular but debated guideline. Treat it
            as a prompt to think, not a rule.
          </p>
        </Section>

        <Section id="easy" title="Percent easy">
          <p>
            {`The share of this week's distance run at an easy effort: distance minus intense distance. Many runners aim for most of their running to be easy; this app uses ${config.easyTargetPercent}% by default (the “80/20” idea), and shows it green at or above that.`}
          </p>
        </Section>

        <Section id="prior-weeks" title="Prior weeks">
          <p>
            {`Your actual weekly distances for up to ${config.chronicWeeks} weeks before the plan starts, so the first weeks have something to compare against. Add them from `}
            <strong>Prior weeks</strong> on the plan page.
          </p>
        </Section>

        <Section id="status" title="Planned, done and missed">
          <p>
            Tap an activity&apos;s status to cycle it: ○ planned, ✓ done, ✗ missed. Missed runs are left out
            of the stats, so a week you didn&apos;t finish shows the load you actually did.
          </p>
        </Section>

        <Section id="blocks" title="Blocks">
          <p>
            Grey bars split a plan into training blocks. Use <strong>Edit blocks</strong>{" "}
            to add, move or
            remove them. They&apos;re just for organising and don&apos;t change any numbers.
          </p>
        </Section>

        <Section id="colours" title="Colours">
          <ul className="flex flex-wrap gap-2">
            <li className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">Easy run</li>
            <li className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">Workout</li>
            <li className="px-2 py-0.5 rounded bg-green-100 text-green-800">Long run</li>
            <li className="px-2 py-0.5 rounded bg-red-100 text-red-800">Race</li>
            <li className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">Gym</li>
          </ul>
        </Section>
      </div>

      <p className="mt-8 text-sm">
        <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
          Privacy
        </Link>
      </p>
    </div>
  );
}
