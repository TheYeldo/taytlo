import SplitText from "@/components/SplitText";

export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-title">
      <span>{eyebrow}</span>
      <SplitText tag="h2" text={title} splitType="words" delay={28} duration={0.72} textAlign="left" />
    </div>
  );
}
