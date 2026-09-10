"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
};

type Barber = {
  id: string;
  name: string;
  specialty: string;
  initials: string;
};

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

const services: Service[] = [
  {
    id: "corte-imperial",
    name: "Corte Imperial",
    description: "Consultoria, lavagem, corte e finalização.",
    price: 95,
    duration: "50 min",
  },
  {
    id: "barboterapia",
    name: "Barboterapia",
    description: "Toalha quente, óleo, navalha e hidratação.",
    price: 75,
    duration: "40 min",
  },
  {
    id: "combo-casa",
    name: "Combo da Casa",
    description: "Corte Imperial e Barboterapia em uma sessão.",
    price: 150,
    duration: "1h25",
  },
  {
    id: "acabamento",
    name: "Acabamento",
    description: "Contornos, costeletas e nuca alinhados.",
    price: 45,
    duration: "25 min",
  },
];

const barbers: Barber[] = [
  { id: "augusto", name: "Augusto Neri", specialty: "Clássicos & tesoura", initials: "AN" },
  { id: "rafael", name: "Rafael Luz", specialty: "Degradê & textura", initials: "RL" },
  { id: "miguel", name: "Miguel Reis", specialty: "Barba & navalha", initials: "MR" },
];

const times = ["09:30", "10:45", "12:00", "14:30", "16:00", "17:15", "18:30", "19:45"];

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function getNextDays() {
  const formatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      id: date.toISOString().slice(0, 10),
      label: index === 0 ? "Hoje" : formatter.format(date).replace(".", ""),
    };
  });
}

function ImperialMonogram({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <path className="monogram-frame" d="M48 3 84 19v58L48 93 12 77V19L48 3Z" />
      <path className="monogram-orbit" d="M48 12c19.88 0 36 16.12 36 36S67.88 84 48 84 12 67.88 12 48 28.12 12 48 12Z" />
      <path className="monogram-letter" d="M31 27h16M39 27v42M31 69h16" />
      <path className="monogram-letter" d="M51 27v42M51 28h7.5c8 0 12.5 4.2 12.5 10.1 0 5.7-4.5 9.9-12.5 9.9H51m7.5 0c9 0 14 4.3 14 10.5S67.5 69 58.5 69H51" />
      <path className="monogram-blade" d="M23 75 74 21M65 25l8-4-3 9" />
      <path className="monogram-crown" d="M38 15 43 9l5 6 5-6 5 6" />
    </svg>
  );
}

export default function Home() {
  const days = useMemo(getNextDays, []);
  const [serviceId, setServiceId] = useState(services[0].id);
  const [barberId, setBarberId] = useState(barbers[0].id);
  const [dayId, setDayId] = useState(days[0]?.id ?? "");
  const [time, setTime] = useState("18:30");
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);

  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const barber = barbers.find((item) => item.id === barberId) ?? barbers[0];
  const day = days.find((item) => item.id === dayId) ?? days[0];

  useEffect(() => {
    const root = document.documentElement;
    const animated = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      const viewport = window.innerHeight;
      const pageRange = Math.max(document.documentElement.scrollHeight - viewport, 1);
      const pageProgress = Math.min(Math.max(scrollY / pageRange, 0), 1);
      const heroProgress = Math.min(Math.max(scrollY / Math.max(viewport * 0.9, 1), 0), 1);

      root.style.setProperty("--page-progress", pageProgress.toFixed(4));
      root.style.setProperty("--hero-shift", `${Math.round(heroProgress * 110)}px`);
      root.style.setProperty("--hero-shift-mobile", `${Math.round(heroProgress * 38)}px`);
      root.style.setProperty("--hero-zoom", (1.035 + heroProgress * 0.12).toFixed(4));
      root.style.setProperty("--hero-fade", (1 - heroProgress * 0.68).toFixed(4));
      document.body.toggleAttribute("data-scrolled", scrollY > 72);

      animated.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const raw = (viewport - rect.top) / Math.max(viewport + rect.height * 0.5, 1);
        const progress = reducedMotion.matches ? 1 : Math.min(Math.max(raw, 0), 1);
        element.style.setProperty("--scroll-p", progress.toFixed(4));
        element.style.setProperty("--scroll-offset", `${Math.round((1 - progress) * 96)}px`);
        element.style.setProperty("--scroll-offset-soft", `${Math.round((1 - progress) * 43)}px`);
        element.style.setProperty("--scroll-offset-mini", `${Math.round((1 - progress) * 27)}px`);
        element.style.setProperty("--scroll-parallax", `${Math.round((progress - 0.5) * -110)}px`);
        element.style.setProperty("--scroll-parallax-soft", `${Math.round((progress - 0.5) * -39)}px`);
        element.style.setProperty("--scroll-opacity", (0.35 + progress * 0.65).toFixed(4));
        element.style.setProperty("--scroll-wipe", `${Math.max(0, (1 - progress) * 100).toFixed(2)}%`);
        element.style.setProperty("--scroll-scale", (1.12 - progress * 0.12).toFixed(4));
        element.style.setProperty("--marquee-x", `${Math.round((0.5 - progress) * 38)}vw`);
      });
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    const allowedServices = services.map((item) => item.id);
    const allowedBarbers = barbers.map((item) => item.id);
    void Promise.resolve(
      context.registerTool(
        {
          name: "create_booking",
          title: "Agendar horário na Imperial Barber",
          description: "Cria uma reserva visível no site usando serviço, barbeiro, data e horário disponíveis.",
          inputSchema: {
            type: "object",
            properties: {
              serviceId: { type: "string", enum: allowedServices },
              barberId: { type: "string", enum: allowedBarbers },
              date: { type: "string", description: "Data no formato AAAA-MM-DD" },
              time: { type: "string", enum: times },
            },
            required: ["serviceId", "barberId", "date", "time"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const value = input as { serviceId?: string; barberId?: string; date?: string; time?: string };
            if (
              !value.serviceId || !allowedServices.includes(value.serviceId) ||
              !value.barberId || !allowedBarbers.includes(value.barberId) ||
              !value.date || !days.some((item) => item.id === value.date) ||
              !value.time || !times.includes(value.time)
            ) {
              throw new Error("Serviço, barbeiro, data ou horário indisponível.");
            }
            setServiceId(value.serviceId);
            setBarberId(value.barberId);
            setDayId(value.date);
            setTime(value.time);
            setStep(4);
            setConfirmed(true);
            return { status: "confirmed", serviceId: value.serviceId, barberId: value.barberId, date: value.date, time: value.time };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, [days]);

  function confirmBooking() {
    setConfirmed(true);
    setStep(4);
    toast.success("Horário reservado", { description: `${day?.label}, às ${time}, com ${barber.name}.` });
  }

  function restartBooking() {
    setConfirmed(false);
    setStep(1);
  }

  function sendMockReminder() {
    toast.success("Lembrete simulado", {
      description: `${service.name} · ${day?.label}, ${time}. Em produção, conecte aqui o WhatsApp da barbearia.`,
    });
  }

  return (
    <main className="site-shell">
      <aside className="scroll-meter" aria-hidden="true">
        <span>IB</span><i><b /></i><span>MMXII</span>
      </aside>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Imperial Barber — início">
          <span className="brand-mark"><ImperialMonogram /></span>
          <span className="brand-copy"><strong>Imperial</strong><small>Barber · São Paulo</small></span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#ritual">O ritual</a>
          <a href="#galeria">Galeria</a>
        </nav>
        <a className="header-cta" href="#agenda">Reservar horário</a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Barbearia &amp; alfaiataria do gesto</p>
          <h1><span>Precisão é</span><br /><span>uma forma</span><br /><em>de presença.</em></h1>
          <p className="hero-intro">
            Cortes clássicos, barba à toalha quente e um tempo reservado
            para você — sem pressa, sem excesso.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#agenda">Agendar meu ritual <span>↗</span></a>
            <span className="availability"><i /> Próximo horário hoje, 18:30</span>
          </div>
        </div>

        <figure className="hero-portrait">
          <img src="/images/imperial-hero.png" alt="Mestre barbeiro realizando um corte de precisão" />
          <div className="hero-seal"><ImperialMonogram /><span>Ofício<br />desde 2012</span></div>
          <figcaption><span>01</span> O ofício, elevado ao ritual.</figcaption>
        </figure>

        <aside className="hero-note" aria-label="Informações da barbearia">
          <span>Desde 2012</span>
          <p>Alameda Imperial, 120<br />Jardins — São Paulo</p>
        </aside>
      </section>

      <div className="marquee" data-scroll="marquee" aria-hidden="true">
        <div>TRADIÇÃO&nbsp; ◆ &nbsp;PRECISÃO&nbsp; ◆ &nbsp;PRESENÇA&nbsp; ◆ &nbsp;RITUAL&nbsp; ◆ &nbsp;TRADIÇÃO&nbsp; ◆ &nbsp;PRECISÃO&nbsp; ◆ &nbsp;PRESENÇA</div>
      </div>

      <section className="ritual section-paper" id="ritual" data-scroll="section">
        <div className="section-index">01 / O ritual</div>
        <div className="ritual-lead" data-scroll="title">
          <p className="kicker">Antes do espelho, a escuta.</p>
          <h2>Há coisas que<br />não se apressam.</h2>
        </div>
        <div className="ritual-story" data-scroll="copy">
          <p className="dropcap">O primeiro gesto é entender. O fio, o rosto, a rotina. Depois vêm a toalha quente, a espuma feita à mão e o som exato da tesoura.</p>
          <p>Na Imperial, técnica e hospitalidade dividem a mesma cadeira. Cada atendimento respeita o seu tempo — e devolve a você uma imagem que parece ter estado ali desde sempre.</p>
          <blockquote>“Um bom corte não pede atenção. Ele sustenta presença.”</blockquote>
        </div>
        <figure className="ritual-image image-reveal" data-scroll="image">
          <img src="/images/imperial-ritual.png" alt="Preparação da toalha quente e navalha para barboterapia" />
          <figcaption>Preparação / Barboterapia</figcaption>
        </figure>
        <div className="ritual-stat"><strong>14</strong><span>anos aperfeiçoando<br />o mesmo ofício</span></div>
      </section>

      <section className="services" id="servicos" data-scroll="section">
        <header className="services-heading" data-scroll="title">
          <div className="section-index">02 / Menu da casa</div>
          <h2>Serviços de<br /><em>precisão.</em></h2>
          <p>Valores claros. Tempo reservado. Produtos selecionados para cada fio e pele.</p>
        </header>
        <div className="service-menu" role="list">
          {services.map((item, index) => (
            <div className="service-row" role="listitem" key={item.id} data-scroll="row">
              <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{item.name}</h3><p>{item.description}</p></div>
              <span className="service-duration">{item.duration}</span>
              <strong>{money(item.price)}</strong>
            </div>
          ))}
          <a className="menu-link" href="#agenda">Escolher um serviço <span>↓</span></a>
        </div>
      </section>

      <section className="gallery" id="galeria" aria-labelledby="gallery-title" data-scroll="section">
        <div className="gallery-title" data-scroll="title">
          <div className="section-index">03 / Caderno visual</div>
          <h2 id="gallery-title">Matéria,<br />gesto &amp; forma.</h2>
        </div>
        <figure className="gallery-a image-reveal" data-scroll="image">
          <img src="/images/imperial-interior.png" alt="Interior da Imperial Barber com cadeiras de couro e espelhos de latão" />
          <figcaption>Ateliê / Jardins</figcaption>
        </figure>
        <figure className="gallery-b image-reveal" data-scroll="image">
          <img src="/images/imperial-hero.png" alt="Detalhe de corte masculino feito com tesoura" />
          <figcaption>Tesoura / Forma</figcaption>
        </figure>
        <figure className="gallery-c image-reveal" data-scroll="image">
          <img src="/images/imperial-ritual.png" alt="Detalhes do ritual de barba tradicional" />
          <figcaption>Navalha / Ritual</figcaption>
        </figure>
        <p className="gallery-note">Uma seleção do nosso trabalho diário. Sem tendências emprestadas: cada corte nasce do encontro entre traço, textura e rotina.</p>
      </section>

      <section className="booking" id="agenda" data-scroll="section">
        <header className="booking-intro" data-scroll="title">
          <div className="section-index">04 / Reserva</div>
          <p className="kicker">Sua cadeira espera.</p>
          <h2>Escolha sem<br />intermediários.</h2>
          <p>Quatro decisões, menos de um minuto. A confirmação chega pronta para o WhatsApp.</p>
          <div className="booking-contact">
            <span>Conheça a casa</span>
            <a href="#localizacao">Ver endereço</a>
          </div>
        </header>

        <div className="booking-app" data-scroll="panel">
          <ol className="step-track" aria-label="Etapas do agendamento">
            {["Serviço", "Especialista", "Horário", "Confirmação"].map((label, index) => (
              <li key={label} className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""}>
                <button type="button" onClick={() => !confirmed && setStep(index + 1)} disabled={confirmed && index < 3}>
                  <span>{String(index + 1).padStart(2, "0")}</span>{label}
                </button>
              </li>
            ))}
          </ol>

          <div className="booking-stage" aria-live="polite">
            {step === 1 && (
              <div className="step-panel">
                <p className="step-kicker">Comece pelo ritual</p>
                <h3>O que faremos hoje?</h3>
                <RadioGroup value={serviceId} onValueChange={setServiceId} className="choice-list" aria-label="Escolha o serviço">
                  {services.slice(0, 3).map((item) => (
                    <label className="choice-row" key={item.id}>
                      <RadioGroupItem value={item.id} />
                      <span><strong>{item.name}</strong><small>{item.description}</small></span>
                      <span>{item.duration}</span>
                      <b>{money(item.price)}</b>
                    </label>
                  ))}
                </RadioGroup>
                <Button className="booking-next" onClick={() => setStep(2)}>Escolher especialista <span>→</span></Button>
              </div>
            )}

            {step === 2 && (
              <div className="step-panel">
                <p className="step-kicker">Mãos especializadas</p>
                <h3>Com quem você prefere?</h3>
                <RadioGroup value={barberId} onValueChange={setBarberId} className="barber-list" aria-label="Escolha o barbeiro">
                  {barbers.map((item) => (
                    <label className="barber-row" key={item.id}>
                      <RadioGroupItem value={item.id} />
                      <span className="barber-monogram">{item.initials}</span>
                      <span><strong>{item.name}</strong><small>{item.specialty}</small></span>
                    </label>
                  ))}
                </RadioGroup>
                <div className="booking-nav">
                  <Button variant="ghost" onClick={() => setStep(1)}>← Voltar</Button>
                  <Button className="booking-next" onClick={() => setStep(3)}>Escolher horário <span>→</span></Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-panel">
                <p className="step-kicker">Agenda de {barber.name.split(" ")[0]}</p>
                <h3>Quando fica melhor?</h3>
                <div className="date-strip" role="group" aria-label="Escolha a data">
                  {days.map((item) => (
                    <button type="button" className={dayId === item.id ? "selected" : ""} onClick={() => setDayId(item.id)} key={item.id}>{item.label}</button>
                  ))}
                </div>
                <div className="time-grid" role="group" aria-label="Escolha o horário">
                  {times.map((item, index) => (
                    <button type="button" disabled={index === 2 || index === 5} className={time === item ? "selected" : ""} onClick={() => setTime(item)} key={item}>{item}</button>
                  ))}
                </div>
                <p className="slot-note">Horários riscados já foram reservados.</p>
                <div className="booking-nav">
                  <Button variant="ghost" onClick={() => setStep(2)}>← Voltar</Button>
                  <Button className="booking-next" onClick={confirmBooking}>Revisar reserva <span>→</span></Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="step-panel confirmation">
                <p className="step-kicker">Reserva confirmada</p>
                <h3>Sua cadeira está pronta.</h3>
                <p className="confirmation-copy">Guardamos este horário para você. Use o botão abaixo para receber o resumo no WhatsApp.</p>
                <dl>
                  <div><dt>Serviço</dt><dd>{service.name}</dd></div>
                  <div><dt>Especialista</dt><dd>{barber.name}</dd></div>
                  <div><dt>Quando</dt><dd>{day?.label}, {time}</dd></div>
                  <div><dt>Total</dt><dd>{money(service.price)}</dd></div>
                </dl>
                <button type="button" className="whatsapp-action" onClick={sendMockReminder}>Simular lembrete no WhatsApp <span>↗</span></button>
                <button type="button" className="restart" onClick={restartBooking}>Fazer outro agendamento</button>
              </div>
            )}
          </div>
          {!confirmed && (
            <footer className="booking-summary">
              <span>Seu ritual</span>
              <strong>{service.name}</strong>
              <span>{barber.name} · {day?.label} · {time}</span>
              <b>{money(service.price)}</b>
            </footer>
          )}
        </div>
      </section>

      <section className="location" id="localizacao" data-scroll="section">
        <div className="location-map" data-scroll="image">
          <iframe title="Mapa da região dos Jardins, em São Paulo" src="https://www.google.com/maps?q=Jardins%20Sao%20Paulo&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <span>23°33′43″S / 46°40′11″W</span>
        </div>
        <div className="location-info" data-scroll="title">
          <div className="section-index">05 / Visite</div>
          <p className="kicker">Jardins, São Paulo</p>
          <h2>Um intervalo<br />bem localizado.</h2>
          <address>Alameda Imperial, 120<br />Jardins — São Paulo <small>(endereço conceitual)</small></address>
          <a className="directions" href="https://maps.google.com/?q=Jardins+Sao+Paulo" target="_blank" rel="noreferrer">Ver região ↗</a>
          <div className="hours">
            <div><span>Terça — Sexta</span><strong>09:00 — 20:00</strong></div>
            <div><span>Sábado</span><strong>09:00 — 18:00</strong></div>
            <div><span>Domingo &amp; Segunda</span><strong>Fechado</strong></div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark footer-emblem"><ImperialMonogram /></span><span className="brand-copy"><strong>Imperial</strong><small>Barber · São Paulo</small></span></a>
        <p>O ofício de cuidar,<br />sem perder a medida.</p>
        <div className="footer-links"><a href="#servicos">Serviços</a><a href="#agenda">Agenda</a><a href="#localizacao">Localização</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram ↗</a></div>
        <div className="footer-bottom"><span>© 2026 Imperial Barber</span><span>São Paulo — Brasil</span><a href="#inicio">Voltar ao topo ↑</a></div>
      </footer>
      <Toaster position="bottom-right" />
    </main>
  );
}
