import { Logo } from "@/components/Logo";
import { navLinks } from "@/lib/nav";
import { plans } from "@/lib/plans";
const features = [
  {
    name: "AI Marketing Assistant",
    description:
      "An AI marketing assistant that lives in Chrome — analyze pages, generate ideas, and move faster without leaving your browser.",
  },
  {
    name: "Content Analysis",
    description:
      "An AI marketing assistant that lives in Chrome — analyze pages, generate ideas, and move faster without leaving your browser.",
  },
  {
    name: "Smart Suggestions",
    description:
      "An AI marketing assistant that lives in Chrome — analyze pages, generate ideas, and move faster without leaving your browser.",
  },
  {
    name: "Faster Workflow",
    description:
      "An AI marketing assistant that lives in Chrome — analyze pages, generate ideas, and move faster without leaving your browser.",
  },
];
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo className="[&_span:last-child]:text-white" />
          <p className="mt-4 text-sm leading-6 text-slate-400">
            An AI marketing assistant that lives in Chrome — analyze pages,
            generate ideas, and move faster without leaving your browser.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Product</p>
          <ul className="mt-4 space-y-2.5">
            {navLinks
              .filter((link) => link.label !== "Home")
              .map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Features</p>
          <ul className="mt-4 space-y-2.5">
            {features.map((feature) => (
              <li key={feature.name}>
                <p className="text-sm text-slate-400">{feature.name}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Pricing</p>
          <ul className="mt-4 space-y-2.5">
            {plans.map((plan) => (
              <li key={plan.name}>
                <a
                  href="#pricing"
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  {plan.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} Marketing AI. All rights reserved.</p>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-slate-300"
          >
            How It Works
          </a>
        </div>
      </div>
    </footer>
  );
}
