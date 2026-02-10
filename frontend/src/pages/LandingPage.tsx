import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';

import { PLANS as plans } from '../config/plans';

const platformHighlights = [
    'Secure by design with audit trails, roles, and permissions',
    'Automations mirror how your teams work out of the box',
    'AI-powered data capture for documents, licenses, and compliance',
    'Shared portals so customers self-serve when it makes sense'
];

const testimonialHighlights = [
    'Adaptive dashboards for finance, tax, and compliance teams',
    'Built-in documents with upload, versioning, and approvals',
    'Multi-source activity logs from email, SMS, and portals',
    'Journeys for compliance, renewals, and onboarding'
];


export default function LandingPage() {
    // Trial logic removed
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [planNotice, setPlanNotice] = useState(false);
    const plansRef = useRef<HTMLDivElement | null>(null);

    const handlePlanSelection = (planName: string) => {
        setSelectedPlan(planName);
        navigate(`/subscription?plan=${encodeURIComponent(planName)}`);
    };

    const handleCreateAccountClick = () => {
        if (!selectedPlan) {
            plansRef.current?.scrollIntoView({ behavior: 'smooth' });
            setPlanNotice(true);
            return;
        }
        navigate(`/login?mode=signup&plan=${encodeURIComponent(selectedPlan)}`);
    };
    return (
        <div className="min-h-screen bg-black text-white">
            <section className="relative isolate overflow-hidden bg-black px-6 py-20 md:py-28">
                <div className="mx-auto max-w-6xl lg:flex lg:items-center lg:gap-10 surface-panel py-12 px-10">
                    <div className="max-w-2xl space-y-6">
                        <p className="text-sm uppercase tracking-[0.4em] text-primary-300">DocuFlow CRM</p>
                        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                            Build stronger customer relationships and close more deals.
                        </h1>
                        <p className="text-lg text-slate-200">
                            A modern, scalable SaaS CRM built for finance, tax, and professional services teams.
                            Manage leads, customers, documents, and teams from a unified, secure platform.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleCreateAccountClick}
                                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase text-slate-900 shadow-lg shadow-white/30 transition hover:bg-gray-100"
                            >
                                Create an account
                            </button>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold uppercase text-white transition hover:border-white hover:bg-white/10"
                            >
                                Log in
                            </Link>
                        </div>
                    </div>
                    <div className="mt-10 flex-1 surface-panel-muted p-8 lg:mt-0">
                        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-white/70">Trusted by</p>
                        <div className="mt-6 grid grid-cols-3 gap-4 text-xs font-bold uppercase text-white/70 sm:grid-cols-3">
                            {['Atlas Legal', 'Northwind Consulting', 'Apex Tax', 'Sawa Finance'].map((brand) => (
                                <span key={brand} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                                    {brand}
                                </span>
                            ))}
                        </div>
                        <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 px-6 py-5 text-sm text-white/70">
                            <p className="font-semibold text-white">“DocuFlow gives us a complete 360° customer view—teams hit SLA targets faster.”</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.4em] text-white/60">Finance Teams • UAE</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-6 py-20 md:py-28">
                <div ref={plansRef} id="plans-section" className="mx-auto max-w-6xl surface-panel py-10 px-8">
                    <div className="grid gap-10 md:grid-cols-3">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`flex h-full flex-col gap-6 rounded-3xl surface-panel-muted px-6 py-8 border border-white/10 transition ${plan.highlighted ? 'border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.7)]' : ''}`}
                            >
                                <header>
                                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">{plan.name}</p>
                                    <div className="mt-4 flex items-baseline gap-2">
                                        <span className="text-5xl font-bold text-white">${plan.price}</span>
                                        <span className="text-sm text-white/80">{plan.period}</span>
                                    </div>
                                    <p className="mt-3 text-sm text-white/70">{plan.description}</p>
                                </header>
                                <div className="flex-1">
                                    <ul className="space-y-3 text-sm">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2 text-white/80">
                                                <span className="mt-0.5 h-2 w-2 rounded-full bg-white/80" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handlePlanSelection(plan.name)}
                                    className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold uppercase transition ${plan.highlighted
                                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                                        : 'border border-white/60 text-white hover:border-white hover:bg-white/10'
                                        }`}
                                >
                                    {selectedPlan === plan.name ? 'Selected' : 'Select plan'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {planNotice && (
                <div className="fixed bottom-6 right-6 rounded-xl bg-white/5 px-5 py-3 text-sm text-white shadow-2xl border border-white/10 backdrop-blur-md">
                    Select a plan before creating an account.
                </div>
            )}

            {/* Request a trial section removed */}

            <section className="px-6 py-20 md:py-28">
                <div className="mx-auto max-w-4xl text-center">
                    <p className="text-sm uppercase tracking-[0.4em] text-primary-400">Platform highlights</p>
                    <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Everything a modern services firm needs.</h2>
                    <p className="mt-3 text-lg text-slate-300">
                        Automations, shared inboxes, customer portals, and AI data extraction are ready to plug into your existing workstreams.
                    </p>
                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        {platformHighlights.map((text) => (
                            <div key={text} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-base text-slate-200 shadow-lg shadow-black/30">
                                {text}
                            </div>
                        ))}
                        {testimonialHighlights.map((text) => (
                            <div key={text} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-base text-slate-200 shadow-lg shadow-black/30">
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
