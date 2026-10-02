import type { Metadata } from "next";

import {
  getFaqs,
  getGallery,
  getLeisure,
  getOutlets,
  getReviews,
  getRooms,
  getSite,
  getVenues,
  type Image,
  type TrustStatus,
} from "@/content";

export const metadata: Metadata = {
  title: "Content inspector — Hotel Dipali",
  robots: { index: false, follow: false },
};

function StatusChip({ status }: { status: TrustStatus }) {
  const cls =
    status === "verified"
      ? "bg-brand text-brand-ink"
      : status === "public-unverified"
        ? "bg-accent text-accent-ink"
        : "border border-line text-ink";
  return (
    <span className={`inline-flex min-h-6 items-center px-2 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function countByStatus(items: ReadonlyArray<{ status: TrustStatus }>) {
  return items.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { sample: 0, "public-unverified": 0, verified: 0 } as Record<TrustStatus, number>,
  );
}

export default async function ContentInspectorPage() {
  const [site, rooms, venues, outlets, leisure, faqs, reviews, gallery] =
    await Promise.all([
      getSite(),
      getRooms(),
      getVenues(),
      getOutlets(),
      getLeisure(),
      getFaqs(),
      getReviews(),
      getGallery(),
    ]);

  const images: Image[] = [
    ...rooms.flatMap((r) => r.images),
    ...venues.flatMap((v) => v.images),
    ...outlets.flatMap((o) => o.images),
    ...leisure.pool.images,
    ...leisure.gym.images,
    ...gallery.map((g) => g.image),
  ];

  const collections: Array<{
    name: string;
    items: ReadonlyArray<{ status: TrustStatus }>;
  }> = [
    { name: "Rooms", items: rooms },
    { name: "Venues", items: venues },
    { name: "Outlets", items: outlets },
    { name: "FAQs", items: faqs },
    { name: "Reviews", items: reviews },
    { name: "Memberships", items: leisure.memberships },
  ];

  return (
    <div className="container-site section flex flex-col gap-16">
      <header>
        <p className="eyebrow">Internal · not indexed</p>
        <h1 className="heading-1 mt-2">Content inspector</h1>
        <p className="body-lg mt-3">
          Dev-only view of the sample content layer. Remove or block before launch
          (PLAN.md step 18).
        </p>
      </header>

      <section aria-labelledby="counts">
        <h2 id="counts" className="heading-2">
          Counts by collection &amp; status
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="eyebrow py-2 pr-6">Collection</th>
                <th className="eyebrow py-2 pr-6">Total</th>
                <th className="eyebrow py-2 pr-6">sample</th>
                <th className="eyebrow py-2 pr-6">public-unverified</th>
                <th className="eyebrow py-2">verified</th>
              </tr>
            </thead>
            <tbody>
              {collections.map(({ name, items }) => {
                const counts = countByStatus(items);
                return (
                  <tr key={name} className="border-t border-line">
                    <td className="body py-2 pr-6">{name}</td>
                    <td className="body py-2 pr-6">{items.length}</td>
                    <td className="body py-2 pr-6">{counts.sample}</td>
                    <td className="body py-2 pr-6">{counts["public-unverified"]}</td>
                    <td className="body py-2">{counts.verified}</td>
                  </tr>
                );
              })}
              <tr className="border-t border-line">
                <td className="body py-2 pr-6">Gallery items</td>
                <td className="body py-2 pr-6" data-testid="gallery-count">
                  {gallery.length}
                </td>
                <td className="body py-2 pr-6" colSpan={3}>
                  (image status tracked per image)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="rooms">
        <h2 id="rooms" className="heading-2">
          Rooms
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="eyebrow py-2 pr-6">Name</th>
                <th className="eyebrow py-2 pr-6">Bed</th>
                <th className="eyebrow py-2 pr-6">Max guests</th>
                <th className="eyebrow py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.slug} className="border-t border-line">
                  <td className="body py-2 pr-6">{room.name}</td>
                  <td className="body py-2 pr-6">{room.bed}</td>
                  <td className="body py-2 pr-6">{room.maxGuests}</td>
                  <td className="py-2">
                    <StatusChip status={room.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="venues">
        <h2 id="venues" className="heading-2">
          Venues
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="eyebrow py-2 pr-6">Name</th>
                <th className="eyebrow py-2 pr-6">Kind</th>
                <th className="eyebrow py-2 pr-6">Seated</th>
                <th className="eyebrow py-2 pr-6">Floating</th>
                <th className="eyebrow py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((venue) => (
                <tr key={venue.slug} className="border-t border-line">
                  <td className="body py-2 pr-6">{venue.name}</td>
                  <td className="body py-2 pr-6">{venue.kind}</td>
                  <td className="body py-2 pr-6">{venue.capacitySeated}</td>
                  <td className="body py-2 pr-6">{venue.capacityFloating}</td>
                  <td className="py-2">
                    <StatusChip status={venue.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="outlets">
        <h2 id="outlets" className="heading-2">
          Outlets
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="eyebrow py-2 pr-6">Name</th>
                <th className="eyebrow py-2 pr-6">Kind</th>
                <th className="eyebrow py-2 pr-6">Diet policy</th>
                <th className="eyebrow py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {outlets.map((outlet) => (
                <tr key={outlet.slug} className="border-t border-line">
                  <td className="body py-2 pr-6">{outlet.name}</td>
                  <td className="body py-2 pr-6">{outlet.kind}</td>
                  <td className="body py-2 pr-6">{outlet.dietPolicy.value}</td>
                  <td className="py-2">
                    <StatusChip status={outlet.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="contacts">
        <h2 id="contacts" className="heading-2">
          Contacts
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="eyebrow py-2 pr-6">Department</th>
                <th className="eyebrow py-2 pr-6">Label</th>
                <th className="eyebrow py-2 pr-6">Phone</th>
                <th className="eyebrow py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {site.contacts.map((contact) => (
                <tr key={contact.department} className="border-t border-line">
                  <td className="body py-2 pr-6">{contact.department}</td>
                  <td className="body py-2 pr-6">{contact.label}</td>
                  <td className="body py-2 pr-6">{contact.phone.value}</td>
                  <td className="py-2">
                    <StatusChip status={contact.phone.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="faqs">
        <h2 id="faqs" className="heading-2">
          FAQs
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="eyebrow py-2 pr-6">Group</th>
                <th className="eyebrow py-2 pr-6">Question</th>
                <th className="eyebrow py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={`${faq.group}-${faq.order}`} className="border-t border-line">
                  <td className="body py-2 pr-6">{faq.group}</td>
                  <td className="body py-2 pr-6">{faq.question}</td>
                  <td className="py-2">
                    <StatusChip status={faq.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="images">
        <h2 id="images" className="heading-2">
          Placeholder images ({images.length})
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <figure key={image.id} className="card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                className="h-auto w-full border-b border-line"
              />
              <figcaption className="caption not-italic p-2">{image.id}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
