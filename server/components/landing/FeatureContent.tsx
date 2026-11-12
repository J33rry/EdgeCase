import AnimatedTitle from "./AnimatedTitle";
import type { Feature } from "./config";

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i, arr) => (
        <span key={i} className="word-mask">
          <span className="word">{w}</span>
          {i < arr.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

function Eyebrow({ feature }: { feature: Feature }) {
  const tutor = feature.object === "tutor";
  return (
    <p
      data-part="eyebrow"
      className={`flex items-center gap-3 font-mono text-[0.8125em] uppercase tracking-[0.16em] ${
        tutor ? "text-ec-green" : "text-ec-orange"
      }`}
    >
      <span className="tabular-nums">{feature.index}</span>
      <span className={`h-px w-8 ${tutor ? "bg-ec-green/60" : "bg-ec-orange/60"}`} />
      <span className="text-white/55">{feature.eyebrow}</span>
    </p>
  );
}

/**
 * Feature copy block. In `stage` mode it is absolutely placed in world pixels
 * and animated by the scroll timeline (words split for the reveal); in `flow`
 * mode it is ordinary responsive content.
 */
export default function FeatureContent({ feature, variant }: { feature: Feature; variant: "stage" | "flow" }) {
  if (variant === "stage") {
    const side = feature.object === "dashboard" ? "left-[1135px] w-[430px]" : "left-[78px] w-[400px]";
    return (
      <article
        data-feature={feature.id}
        aria-label={feature.heading}
        className={`pointer-events-none invisible absolute top-1/2 z-10 -translate-y-1/2 text-[16px] ${side}`}
      >
        <Eyebrow feature={feature} />
        <h2 className="mt-6 text-[66px] font-bold leading-[0.98] tracking-[-0.045em] text-white">
          <Words text={feature.heading} />
        </h2>
        <p data-part="desc" className="mt-7 text-[21px] leading-[1.5] tracking-[-0.01em] text-white/55">
          {feature.description}
        </p>
      </article>
    );
  }

  return (
    <div className="text-[15px]">
      <Eyebrow feature={feature} />
      <AnimatedTitle
        lines={[feature.heading]}
        className="mt-4 text-[clamp(2.25rem,9vw,3.5rem)] font-bold leading-[1] tracking-[-0.045em] text-white"
      />
      <p className="mt-4 max-w-[34rem] text-[clamp(1rem,3.8vw,1.2rem)] leading-[1.55] text-white/55">{feature.description}</p>
    </div>
  );
}
