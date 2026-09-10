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
  const whatsappText = encodeURIComponent(
    `Olá, Imperial Barber. Quero confirmar meu ${service.name} com ${barber.name}, ${day?.label} às ${time}.`,
  );

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

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Imperial Barber — início">
          <span className="brand-mark">IB</span>
          <span>Imperial Barber</span>
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
          <h1>Precisão é<br />uma forma<br /><em>de presença.</em></h1>
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
          <figcaption><span>01</span> O ofício, elevado ao ritual.</figcaption>
        </figure>

        <aside className="hero-note" aria-label="Informações da barbearia">
          <span>Desde 2012</span>
          <p>Rua Oscar Freire, 720<br />São Paulo — SP</p>
        </aside>
      </section>

      <section className="ritual section-paper" id="ritual">
        <div className="section-index">01 / O ritual</div>
        <div className="ritual-lead">
          <p className="kicker">Antes do espelho, a escuta.</p>
          <h2>Há coisas que<br />não se apressam.</h2>
        </div>
        <div className="ritual-story">
          <p className="dropcap">O primeiro gesto é entender. O fio, o rosto, a rotina. Depois vêm a toalha quente, a espuma feita à mão e o som exato da tesoura.</p>
          <p>Na Imperial, técnica e hospitalidade dividem a mesma cadeira. Cada atendimento respeita o seu tempo — e devolve a você uma imagem que parece ter estado ali desde sempre.</p>
          <blockquote>“Um bom corte não pede atenção. Ele sustenta presença.”</blockquote>
        </div>
        <figure className="ritual-image image-reveal">
          <img src="/images/imperial-ritual.png" alt="Preparação da toalha quente e navalha para barboterapia" />
          <figcaption>Preparação / Barboterapia</figcaption>
        </figure>
        <div className="ritual-stat"><strong>14</strong><span>anos aperfeiçoando<br />o mesmo ofício</span></div>
      </section>

      <section className="services" id="servicos">
        <header className="services-heading">
          <div className="section-index">02 / Menu da casa</div>
          <h2>Serviços de<br /><em>precisão.</em></h2>
          <p>Valores claros. Tempo reservado. Produtos selecionados para cada fio e pele.</p>
        </header>
        <div className="service-menu" role="list">
          {services.map((item, index) => (
            <div className="service-row" role="listitem" key={item.id}>
              <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{item.name}</h3><p>{item.description}</p></div>
              <span className="service-duration">{item.duration}</span>
              <strong>{money(item.price)}</strong>
            </div>
          ))}
          <a className="menu-link" href="#agenda">Escolher um serviço <span>↓</span></a>
        </div>
      </section>

      <section className="gallery" id="galeria" aria-labelledby="gallery-title">
        <div className="gallery-title">
          <div className="section-index">03 / Caderno visual</div>
          <h2 id="gallery-title">Matéria,<br />gesto &amp; forma.</h2>
        </div>
        <figure className="gallery-a image-reveal">
          <img src="/images/imperial-interior.png" alt="Interior da Imperial Barber com cadeiras de couro e espelhos de latão" />
          <figcaption>Ateliê / Jardins</figcaption>
        </figure>
        <figure className="gallery-b image-reveal">
          <img src="/images/imperial-hero.png" alt="Detalhe de corte masculino feito com tesoura" />
          <figcaption>Tesoura / Forma</figcaption>
        </figure>
        <figure className="gallery-c image-reveal">
          <img src="/images/imperial-ritual.png" alt="Detalhes do ritual de barba tradicional" />
          <figcaption>Navalha / Ritual</figcaption>
        </figure>
        <p className="gallery-note">Uma seleção do nosso trabalho diário. Sem tendências emprestadas: cada corte nasce do encontro entre traço, textura e rotina.</p>
      </section>

      <section className="booking" id="agenda">
        <header className="booking-intro">
          <div className="section-index">04 / Reserva</div>
          <p className="kicker">Sua cadeira espera.</p>
          <h2>Escolha sem<br />intermediários.</h2>
          <p>Quatro decisões, menos de um minuto. A confirmação chega pronta para o WhatsApp.</p>
          <div className="booking-contact">
            <span>Dúvidas?</span>
            <a href="tel:+551130821912">(11) 3082–1912</a>
          </div>
        </header>

        <div className="booking-app">
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
                <a className="whatsapp-action" href={`https://wa.me/551130821912?text=${whatsappText}`} target="_blank" rel="noreferrer">Receber lembrete no WhatsApp <span>↗</span></a>
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

      <section className="location" id="localizacao">
        <div className="location-map">
          <iframe title="Mapa da Imperial Barber" src="https://www.google.com/maps?q=Rua%20Oscar%20Freire%20720%20Sao%20Paulo&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <span>23°33′43″S / 46°40′11″W</span>
        </div>
        <div className="location-info">
          <div className="section-index">05 / Visite</div>
          <p className="kicker">Jardins, São Paulo</p>
          <h2>Um intervalo<br />bem localizado.</h2>
          <address>Rua Oscar Freire, 720<br />Cerqueira César — São Paulo</address>
          <a className="directions" href="https://maps.google.com/?q=Rua+Oscar+Freire+720+Sao+Paulo" target="_blank" rel="noreferrer">Traçar rota ↗</a>
          <div className="hours">
            <div><span>Terça — Sexta</span><strong>09:00 — 20:00</strong></div>
            <div><span>Sábado</span><strong>09:00 — 18:00</strong></div>
            <div><span>Domingo &amp; Segunda</span><strong>Fechado</strong></div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark">IB</span><span>Imperial Barber</span></a>
        <p>O ofício de cuidar,<br />sem perder a medida.</p>
        <div className="footer-links"><a href="#servicos">Serviços</a><a href="#agenda">Agenda</a><a href="#localizacao">Localização</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram ↗</a></div>
        <div className="footer-bottom"><span>© 2026 Imperial Barber</span><span>São Paulo — Brasil</span><a href="#inicio">Voltar ao topo ↑</a></div>
      </footer>
      <Toaster position="bottom-right" />
    </main>
  );
}
