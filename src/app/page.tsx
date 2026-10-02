// TEMPORARY: replaced in step 6 (Home). This file exists only to let the site
// shell (Header overlay/solid states, MobileMenu, StickyCtaBar, Footer) be
// exercised and tested against a real hero-like layout.

export default function HomePage() {
  return (
    <>
      {/* -mt-18 md:-mt-22 pulls the hero up under the sticky header's reserved
          space so the transparent overlay header actually shows this image,
          not the plain body background. Any future overlay-route hero needs
          the same offset (matching Header's h-18 md:h-22). */}
      <section
        data-theme="dusk"
        className="relative -mt-18 flex h-dvh min-h-150 items-center justify-center bg-cover bg-center md:-mt-22"
        style={{ backgroundImage: "url(/sample/venue-main-lawn-1.svg)" }}
      >
        {/* Temporary legibility scrim for placeholder art; replaced by proper
            image treatment (Picture + reveal) in step 6. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundColor: "rgb(0 0 0 / 0.35)" }}
        />
        <div className="container-site relative text-center">
          <h1 className="heading-hero text-ink">Hotel Dipali, Sagar</h1>
          <p className="body-lg mt-4 text-ink">Website under construction.</p>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-site">
          <p className="body text-ink-muted">
            This spacer exists only to scroll past the header&rsquo;s transparent-to-solid
            transition while the real Home page is built in step 6.
          </p>
        </div>
      </section>

      <div className="h-[150vh]" aria-hidden="true" />
    </>
  );
}
