import { faArrowRight, faCar, faCircleCheck, faFileLines, faKey, faLocationDot, faPhone, faShieldHalved, faTag, faThumbsUp, faMobileScreenButton, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { PlainText } from "@/components/ui/PlainText";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsappButton } from "@/components/ui/WhatsappButton";
import { CONTACT_PHONE, CONTACT_PLACE, CONTACT_TEL, INSTAGRAM_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo/site";
import { getSiteSettings } from "@/lib/settings";
import { GENERAL_MESSAGE, normalizeWhatsapp } from "@/lib/whatsapp";

export const revalidate = 300;
export async function generateMetadata() {
  const s = await getSiteSettings();
  return pageMetadata(s, { title: "About", path: "/about", description: `${s.brandName} buys and sells pre-owned cars in ${CONTACT_PLACE}, with RC transfer and insurance support.` });
}

const SERVICES: Array<{ icon: IconDefinition; title: string; text: string }> = [
  { icon: faKey, title: "Buy used cars", text: "Browse the cars we have listed, with the owner count, kilometres, fuel and condition notes written out for each one." },
  { icon: faTag, title: "Sell your car", text: "Looking to sell? Message us with your car's details and we'll get back to you." },
  { icon: faFileLines, title: "RC transfer support", text: "We help with the name transfer paperwork so the car is moved into your name." },
  { icon: faShieldHalved, title: "Insurance & FC support", text: "Insurance and FC (fitness certificate) details are mentioned on our listings, and we help with renewals." },
];

const PROMISES = [
  ["Trusted cars. Honest deals.", "That's the line on our number plates, and how we want every sale to feel: clear details up front, no surprises."],
  ["Quality cars, best price", "We list cars across budgets and say plainly what condition they're in, so you can compare before you visit."],
  ["Details you can check", "Each listing states the model year, owner, fuel, kilometres, insurance, FC and tyre condition as given by the seller. Always verify originals before paying."],
];

export default async function About() {
  const s = await getSiteSettings();
  const wa = normalizeWhatsapp(s.whatsapp);
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
      <p className="eyebrow">About us</p>
      <h1 className="display mt-2 text-4xl sm:text-6xl">About <span className="accent-text">{s.brandName}</span></h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        {s.brandName} is a pre-owned car resale and parking sales business based in {CONTACT_PLACE}. We buy and sell used cars and help with RC transfer and insurance, so getting your next car is simple and straightforward.
      </p>

      <Reveal>
        <section className="mt-12" aria-labelledby="what">
          <h2 id="what" className="display text-2xl sm:text-3xl">What we do</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-fg"><FontAwesomeIcon icon={Icon} className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-14" aria-labelledby="why">
          <h2 id="why" className="display text-2xl sm:text-3xl">Why buy from us</h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {PROMISES.map(([t, d]) => (
              <li key={t} className="rounded-3xl bg-surface-2 p-6">
                <FontAwesomeIcon icon={faCircleCheck} className="h-6 w-6 text-accent-ink" aria-hidden />
                <h3 className="mt-3 text-lg font-bold">{t}</h3>
                <p className="mt-1.5 text-sm text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_1fr]" aria-labelledby="find">
          <div className="card p-6 sm:p-8">
            <h2 id="find" className="display text-2xl sm:text-3xl">Find us</h2>
            <ul className="mt-5 grid gap-3 text-lg">
              <li className="flex items-center gap-3"><FontAwesomeIcon icon={faLocationDot} className="h-5 w-5 text-accent-ink" aria-hidden />{CONTACT_PLACE}</li>
              <li className="flex items-center gap-3"><FontAwesomeIcon icon={faPhone} className="h-5 w-5 text-accent-ink" aria-hidden /><a className="font-semibold underline-offset-4 hover:underline" href={`tel:${CONTACT_TEL}`}>{CONTACT_PHONE}</a></li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="btn btn-primary" href={`tel:${CONTACT_TEL}`}><FontAwesomeIcon icon={faPhone} className="h-4 w-4" aria-hidden /> Call us</a>
              <WhatsappButton number={wa} message={GENERAL_MESSAGE} />
              <a className="btn" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faInstagram} className="h-4 w-4" aria-hidden /> Instagram</a>
            </div>
          </div>
          <div className="rounded-3xl bg-fg p-6 text-bg sm:p-8">
            <h2 className="display text-2xl">At a glance</h2>
            <ul className="mt-4 grid gap-3 text-base">
              {([[faCar, "Buy & Sell Used Cars"], [faThumbsUp, "Quality Cars | Best Price"], [faFileLines, "RC Transfer & Insurance Support"], [faLocationDot, CONTACT_PLACE], [faMobileScreenButton, `Contact ${CONTACT_PHONE}`]] as Array<[IconDefinition, string]>).map(([icon, text]) => (
                <li key={text} className="flex items-center gap-3"><FontAwesomeIcon icon={icon} className="h-5 w-5 shrink-0 text-accent" aria-hidden />{text}</li>
              ))}
            </ul>
            {s.about && <div className="mt-5 border-t border-white/15 pt-4 text-sm opacity-90"><PlainText text={s.about} /></div>}
          </div>
        </section>
      </Reveal>

      <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-[28px] bg-accent p-8 text-accent-fg sm:flex-row sm:items-center sm:p-10">
        <h2 className="display text-2xl sm:text-3xl">Ready to find your next car?</h2>
        <Link href="/#available" className="btn">See available cars <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" aria-hidden /></Link>
      </div>
    </main>
  );
}
