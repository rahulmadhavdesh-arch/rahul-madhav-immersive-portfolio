import React, { useState } from "react";
import { profile } from "../../data/content";
import ScanText from "../ui-custom/ScanText";
import Reveal from "../ui-custom/Reveal";
import Button from "../ui-custom/Button";

export default function Contact() {
  const [copied, setCopied] = useState(false);

  // mailto depends on whatever handler the visitor's machine has registered,
  // which on most desktops is nothing useful. Copying the address always works.
  const copyEmail = (e) => {
    e.preventDefault();
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(profile.email).then(done).catch(done);
    else done();
  };

  return (
    <section id="contact" data-testid="contact-section" className="relative pt-32 md:pt-44 pb-10">
      <div className="container-x">
        <ScanText as="h2" accent="touch" className="h-mega text-text text-[clamp(2.4rem,7vw,6rem)]">
          Let's get in touch.
        </ScanText>

        <Reveal as="p" className="p-lead mt-10 md:mt-14 max-w-3xl">
          Open to research, roles, and collaborations in robotics and medical imaging. Based in Baltimore.
        </Reveal>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button onClick={copyEmail} testid="contact-mailto-link" className="btn-lg">
            {copied ? "Copied to clipboard" : profile.email}
          </Button>
          <Button href={profile.linkedin} target="_blank" variant="solid" className="btn-lg" testid="social-linkedin">
            LinkedIn
          </Button>
          <Button href={profile.resumeUrl} download variant="ghost" testid="resume-download-btn">Résumé</Button>
          <Button href={profile.cvUrl} download variant="ghost" testid="cv-download-btn">Academic CV</Button>
        </div>
        <span className="sr-only" role="status" aria-live="polite">{copied ? "Email address copied to clipboard." : ""}</span>
      </div>

      <footer className="mt-28 md:mt-36">
        <div className="container-x pt-7 pb-24 md:pb-8 md:pl-[15rem] flex items-center justify-between flex-wrap gap-4 label">
          <span data-testid="footer-name">© 2026 Rahul Madhav Deshpande</span>
          <span>{profile.site}</span>
          <span>{profile.location}</span>
          <a href="#top" data-hover className="u-link text-text-3 hover:text-text">Back to top</a>
        </div>
      </footer>
    </section>
  );
}
