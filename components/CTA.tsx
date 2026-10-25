import Image from 'next/image';
import Link from 'next/link';

const CTA = () => {
  return (
    <section className="cta-section">
      <div className="cta-badge">Start learning your way</div>
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
        Build & Personalize Your AI Tutor
      </h2>
      <p className="text-sm leading-relaxed text-neutral-300">
        Choose a subject, voice, and teaching style — then learn through low-latency voice
        sessions with live Mermaid diagrams, KaTeX math whiteboards, and your own PDF notes.
      </p>
      <Image src="/images/cta.svg" alt="cta" width={340} height={218} className="my-1" />
      <Link href="/companions/new" className="w-full">
        <button type="button" className="btn-primary w-full justify-center py-3">
          <Image src="/icons/plus.svg" alt="plus" width={14} height={14} />
          <span>Build a New Companion</span>
        </button>
      </Link>
    </section>
  );
};

export default CTA;
