import React, { useState } from "react";
import { teams } from "../../data/content";
import MediaModal from "../modals/MediaModal";
import ScanText from "../ui-custom/ScanText";
import Tile from "../ui-custom/Tile";

const spans = ["md:col-span-7", "md:col-span-5", "md:col-span-5", "md:col-span-7"];

export default function Teams() {
  const [open, setOpen] = useState(null);
  return (
    <section id="teams" data-testid="extras-section" className="relative py-28 md:py-40">
      <div className="container-x">
        <div className="grid md:grid-cols-12 gap-6 items-end mb-12 md:mb-16">
          <ScanText className="h-section text-text md:col-span-12 whitespace-nowrap" accent="led">Teams I've led.</ScanText>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
          {teams.map((x, i) => (
            <Tile key={x.id} index={i} span={spans[i]} tint={x.tint} art={x.art} code={x.tag} title={x.title} text={x.short} logo={x.logo}
              metric={x.period} metricLabel="period" cta="Read" big={i === 0} minH="min-h-[320px] md:min-h-[400px]" testid={`extra-card-${i}`} onClick={() => setOpen(x)} />
          ))}
        </div>
      </div>
      <MediaModal item={open} onClose={() => setOpen(null)} kind="team" />
    </section>
  );
}
