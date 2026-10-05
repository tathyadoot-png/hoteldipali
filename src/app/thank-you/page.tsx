import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/content/SectionHeading";
import { Botanical } from "@/components/decor/Botanical";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";

export const metadata: Metadata = {
  title: "Thank You | Hotel Dipali, Sagar",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <div className="section container-site max-w-2xl">
      <Botanical variant="sprig" className="h-16 w-auto text-highlight" />

      <SectionHeading
        as="h1"
        eyebrow="Enquiry received"
        title="Thank you for writing to us"
        description="Your message has reached the Hotel Dipali team. We’ll get back to you."
        className="mt-6"
      />

      <div className="card mt-10 flex flex-col gap-3 p-6">
        <p className="eyebrow">If it&rsquo;s urgent</p>
        <p className="body">
          Call or WhatsApp us directly and our team will help right away.
        </p>
        <div className="mt-2 flex flex-wrap gap-4">
          <CallLink className="btn-ghost min-h-11">Call us</CallLink>
          <WhatsAppLink context="general" className="btn-primary min-h-11">
            WhatsApp us
          </WhatsAppLink>
        </div>
      </div>

      <Link href="/" prefetch={false} className="link mt-10 inline-block">
        Back to Hotel Dipali
      </Link>
    </div>
  );
}
