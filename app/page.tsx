"use client";

import {
  type FormEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import type {
  PublicBarber,
  PublicCatalog,
  PublicService,
  PublicShopSettings,
} from "@/types/public-booking";

type CatalogStatus = "loading" | "ready" | "error";
type AvailabilityStatus = "idle" | "loading" | "ready" | "error";
type BookingRequest = {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  clientName: string;
  phone: string;
  email: string;
  website: string;
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

const fallbackServices: PublicService[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    name: "Corte Imperial",
    description: "Consultoria, lavagem, corte e finalização.",
    price: 95,
    durationMinutes: 50,
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    name: "Barboterapia",
    description: "Toalha quente, óleo, navalha e hidratação.",
    price: 75,
    durationMinutes: 40,
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    name: "Combo da Casa",
    description: "Corte Imperial e Barboterapia em uma sessão.",
    price: 150,
    durationMinutes: 85,
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    name: "Acabamento",
    description: "Contornos, costeletas e nuca alinhados.",
    price: 45,
    durationMinutes: 25,
  },
];

const fallbackBarbers: PublicBarber[] = [
  { id: "20000000-0000-0000-0000-000000000001", name: "Augusto Neri", specialty: "Clássicos & tesoura", avatarUrl: null },
  { id: "20000000-0000-0000-0000-000000000002", name: "Rafael Luz", specialty: "Degradê & textura", avatarUrl: null },
  { id: "20000000-0000-0000-0000-000000000003", name: "Miguel Reis", specialty: "Barba & navalha", avatarUrl: null },
];

const fallbackSettings: PublicShopSettings = {
  name: "Imperial Barber",
  phone: "(11) 3456-2012",
  whatsapp: "(11) 93456-2012",
  address: "Alameda Imperial, 120 — Jardins, São Paulo/SP",
  openingHours: "Terça a sábado, das 9h às 20h.",
  description: "Barbearia e alfaiataria do gesto.",
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h${String(remainder).padStart(2, "0")}` : `${hours}h`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function toLocalDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function requestPublicBooking(booking: BookingRequest) {
  const response = await fetch("/api/public/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  const payload = (await response.json()) as {
    appointmentId?: string;
    message?: string;
  };

  if (!response.ok || !payload.appointmentId) {
    throw new Error(payload.message ?? "Não foi possível concluir a reserva.");
  }

  return payload.appointmentId;
}

function getNextDays() {
  const formatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      id: toLocalDateId(date),
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
  const days = useMemo(() => getNextDays(), []);
  const [services, setServices] = useState<PublicService[]>(fallbackServices);
  const [barbers, setBarbers] = useState<PublicBarber[]>(fallbackBarbers);
  const [settings, setSettings] = useState<PublicShopSettings>(fallbackSettings);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("loading");
  const [serviceId, setServiceId] = useState(fallbackServices[0].id);
  const [barberId, setBarberId] = useState(fallbackBarbers[0].id);
  const [dayId, setDayId] = useState(days[0]?.id ?? "");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>("idle");
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollFrame = useRef<number | null>(null);

  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const barber = barbers.find((item) => item.id === barberId) ?? barbers[0];
  const day = days.find((item) => item.id === dayId) ?? days[0];

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      try {
        const response = await fetch("/api/public/catalog", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Catalog request failed.");

        const catalog = (await response.json()) as PublicCatalog;
        setServices(catalog.services);
        setBarbers(catalog.barbers);
        if (catalog.settings) setSettings(catalog.settings);
        setServiceId((current) =>
          catalog.services.some((item) => item.id === current)
            ? current
            : (catalog.services[0]?.id ?? ""),
        );
        setBarberId((current) =>
          catalog.barbers.some((item) => item.id === current)
            ? current
            : (catalog.barbers[0]?.id ?? ""),
        );
        setCatalogStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[landing] Unable to refresh public catalog.", error);
        setCatalogStatus("error");
      }
    }

    void loadCatalog();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (step !== 3 || !serviceId || !barberId || !dayId) return;
    const controller = new AbortController();

    async function loadAvailability() {
      setAvailabilityStatus("loading");
      setBookingError(null);
      setSlots([]);
      setTime("");

      try {
        const response = await fetch("/api/public/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId, barberId, date: dayId }),
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          slots?: string[];
          message?: string;
        };
        if (!response.ok) throw new Error(payload.message ?? "Availability request failed.");

        const availableSlots = payload.slots ?? [];
        setSlots(availableSlots);
        setTime(availableSlots[0] ?? "");
        setAvailabilityStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[landing] Unable to load availability.", error);
        setAvailabilityStatus("error");
      }
    }

    void loadAvailability();
    return () => controller.abort();
  }, [barberId, dayId, serviceId, step]);

  useEffect(() => {
    const root = document.documentElement;
    const animated = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll]"));
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
        const travelRaw = (viewport - rect.top) / Math.max(viewport + rect.height * 0.5, 1);
        const travelProgress = Math.min(Math.max(travelRaw, 0), 1);
        const enterRaw = (viewport - rect.top) / Math.max(viewport * 0.42, 1);
        const enterProgress = Math.min(Math.max(enterRaw, 0), 1);
        element.style.setProperty("--scroll-p", enterProgress.toFixed(4));
        element.style.setProperty("--scroll-offset", `${Math.round((1 - enterProgress) * 96)}px`);
        element.style.setProperty("--scroll-offset-soft", `${Math.round((1 - enterProgress) * 43)}px`);
        element.style.setProperty("--scroll-offset-mini", `${Math.round((1 - enterProgress) * 27)}px`);
        element.style.setProperty("--scroll-parallax", `${Math.round((travelProgress - 0.5) * -110)}px`);
        element.style.setProperty("--scroll-parallax-soft", `${Math.round((travelProgress - 0.5) * -39)}px`);
        element.style.setProperty("--scroll-opacity", (0.35 + enterProgress * 0.65).toFixed(4));
        const imageOpacity = Math.min(Math.max(enterProgress / 0.9, 0), 1);
        element.style.setProperty("--image-opacity", imageOpacity.toFixed(4));
        element.style.setProperty("--image-blur", `${((1 - imageOpacity) * 12).toFixed(2)}px`);
        element.style.setProperty("--scroll-wipe", `${Math.max(0, (1 - enterProgress) * 100).toFixed(2)}%`);
        element.style.setProperty("--scroll-scale", (1.12 - travelProgress * 0.12).toFixed(4));
        element.style.setProperty("--marquee-x", `${Math.round((0.5 - travelProgress) * 38)}vw`);
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
      if (scrollFrame.current) window.cancelAnimationFrame(scrollFrame.current);
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
              time: { type: "string", description: "Horário no formato HH:MM" },
              clientName: { type: "string" },
              phone: { type: "string" },
              email: { type: "string" },
            },
            required: ["serviceId", "barberId", "date", "time", "clientName", "phone"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
          async execute(input) {
            const value = input as {
              serviceId?: string;
              barberId?: string;
              date?: string;
              time?: string;
              clientName?: string;
              phone?: string;
              email?: string;
            };
            if (
              !value.serviceId || !allowedServices.includes(value.serviceId) ||
              !value.barberId || !allowedBarbers.includes(value.barberId) ||
              !value.date || !days.some((item) => item.id === value.date) ||
              !value.time || !/^\d{2}:\d{2}$/.test(value.time) ||
              !value.clientName || !value.phone
            ) {
              throw new Error("Revise os dados obrigatórios do agendamento.");
            }
            setServiceId(value.serviceId);
            setBarberId(value.barberId);
            setDayId(value.date);
            setTime(value.time);
            setClientName(value.clientName);
            setPhone(value.phone);
            setEmail(value.email ?? "");
            setStep(4);
            const booking = await requestPublicBooking({
              serviceId: value.serviceId,
              barberId: value.barberId,
              date: value.date,
              time: value.time,
              clientName: value.clientName,
              phone: value.phone,
              email: value.email ?? "",
              website: "",
            });
            setAppointmentId(booking);
            setConfirmed(true);
            return { status: "confirmed", appointmentId: booking };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, [barbers, days, services]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !barber || !day || !time) {
      setBookingError("Volte uma etapa e selecione serviço, profissional, data e horário.");
      return;
    }

    setBookingError(null);
    setIsSubmitting(true);
    try {
      const booking = await requestPublicBooking({
        serviceId: service.id,
        barberId: barber.id,
        date: day.id,
        time,
        clientName,
        phone,
        email,
        website,
      });
      setAppointmentId(booking);
      setConfirmed(true);
      toast.success("Horário reservado", {
        description: `${day.label}, às ${time}, com ${barber.name}.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a reserva. Tente novamente.";
      setBookingError(message);
      toast.error("Reserva não concluída", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  function smoothScroll(event: MouseEvent<HTMLAnchorElement>, targetId: string) {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (!target) return;

    if (scrollFrame.current) window.cancelAnimationFrame(scrollFrame.current);
    const start = window.scrollY;
    const headerOffset = window.innerWidth <= 680 ? 66 : 72;
    const end = Math.max(0, start + target.getBoundingClientRect().top - headerOffset);
    const distance = end - start;
    const duration = Math.min(1200, Math.max(700, Math.abs(distance) * 0.32));
    const startedAt = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo(0, start + distance * eased);
      if (progress < 1) {
        scrollFrame.current = window.requestAnimationFrame(animate);
      } else {
        scrollFrame.current = null;
        window.history.pushState(null, "", `#${targetId}`);
      }
    };

    scrollFrame.current = window.requestAnimationFrame(animate);
  }

  function restartBooking() {
    setConfirmed(false);
    setAppointmentId(null);
    setBookingError(null);
    setClientName("");
    setPhone("");
    setEmail("");
    setTime("");
    setStep(1);
  }

  function openWhatsAppSummary() {
    if (!service || !barber || !day) return;
    const destination = settings.whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá! Acabei de reservar ${service.name} com ${barber.name}, ${day.label}, às ${time}. Código: ${appointmentId?.slice(0, 8) ?? "confirmado"}.`,
    );
    const href = destination
      ? `https://wa.me/${destination.startsWith("55") ? destination : `55${destination}`}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="site-shell">
      <aside className="scroll-meter" aria-hidden="true">
        <span>IB</span><i><b /></i><span>MMXII</span>
      </aside>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Imperial Barber — início" onClick={(event) => smoothScroll(event, "inicio")}>
          <span className="brand-mark"><ImperialMonogram /></span>
          <span className="brand-copy"><strong>Imperial</strong><small>Barber · São Paulo</small></span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#servicos" onClick={(event) => smoothScroll(event, "servicos")}>Serviços</a>
          <a href="#ritual" onClick={(event) => smoothScroll(event, "ritual")}>O ritual</a>
          <a href="#galeria" onClick={(event) => smoothScroll(event, "galeria")}>Galeria</a>
        </nav>
        <a className="header-cta" href="#agenda" onClick={(event) => smoothScroll(event, "agenda")}>Reservar horário</a>
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
            <a className="primary-action" href="#agenda" onClick={(event) => smoothScroll(event, "agenda")}>Agendar meu ritual <span>↗</span></a>
            <span className="availability"><i /> Agenda online atualizada em tempo real</span>
          </div>
        </div>

        <figure className="hero-portrait">
          <img src="/images/imperial-hero.png" alt="Mestre barbeiro realizando um corte de precisão" />
          <div className="hero-seal"><ImperialMonogram /><span>Ofício<br />desde 2012</span></div>
          <figcaption><span>01</span> O ofício, elevado ao ritual.</figcaption>
        </figure>

        <aside className="hero-note" aria-label="Informações da barbearia">
          <span>Desde 2012</span>
          <p>{settings.address}</p>
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
              <span className="service-duration">{formatDuration(item.durationMinutes)}</span>
              <strong>{money(item.price)}</strong>
            </div>
          ))}
          {catalogStatus === "error" && (
            <p className="catalog-note" role="status">
              Exibindo o menu editorial. A agenda online está temporariamente indisponível.
            </p>
          )}
          <a className="menu-link" href="#agenda" onClick={(event) => smoothScroll(event, "agenda")}>Escolher um serviço <span>↓</span></a>
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
            {["Serviço", "Especialista", "Horário", "Seus dados"].map((label, index) => (
              <li key={label} className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""}>
                <button
                  type="button"
                  onClick={() => !confirmed && index + 1 < step && setStep(index + 1)}
                  disabled={confirmed || index + 1 >= step}
                >
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
                {catalogStatus === "loading" && (
                  <p className="booking-state" role="status">Atualizando o menu da casa…</p>
                )}
                {catalogStatus === "error" && (
                  <p className="booking-state is-error" role="alert">
                    A agenda online está temporariamente indisponível. Tente novamente em instantes.
                  </p>
                )}
                {catalogStatus === "ready" && services.length === 0 && (
                  <p className="booking-state" role="status">
                    Nenhum serviço está disponível para reserva no momento.
                  </p>
                )}
                <RadioGroup value={serviceId} onValueChange={setServiceId} className="choice-list" aria-label="Escolha o serviço">
                  {services.map((item) => (
                    <label className="choice-row" key={item.id}>
                      <RadioGroupItem value={item.id} />
                      <span><strong>{item.name}</strong><small>{item.description}</small></span>
                      <span>{formatDuration(item.durationMinutes)}</span>
                      <b>{money(item.price)}</b>
                    </label>
                  ))}
                </RadioGroup>
                <Button
                  className="booking-next"
                  onClick={() => setStep(2)}
                  disabled={catalogStatus !== "ready" || !service}
                >
                  Escolher especialista <span>→</span>
                </Button>
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
                      <span className="barber-monogram">{getInitials(item.name)}</span>
                      <span><strong>{item.name}</strong><small>{item.specialty}</small></span>
                    </label>
                  ))}
                </RadioGroup>
                {barbers.length === 0 && (
                  <p className="booking-state" role="status">
                    Nenhum profissional está disponível para reserva no momento.
                  </p>
                )}
                <div className="booking-nav">
                  <Button variant="ghost" onClick={() => setStep(1)}>← Voltar</Button>
                  <Button className="booking-next" onClick={() => setStep(3)} disabled={!barber}>
                    Escolher horário <span>→</span>
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-panel">
                <p className="step-kicker">Agenda de {barber?.name.split(" ")[0]}</p>
                <h3>Quando fica melhor?</h3>
                <div className="date-strip" role="group" aria-label="Escolha a data">
                  {days.map((item) => (
                    <button type="button" className={dayId === item.id ? "selected" : ""} onClick={() => setDayId(item.id)} key={item.id}>{item.label}</button>
                  ))}
                </div>
                {availabilityStatus === "loading" && (
                  <div className="slot-loading" role="status" aria-label="Consultando horários">
                    {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
                  </div>
                )}
                {availabilityStatus === "ready" && slots.length > 0 && (
                  <div className="time-grid" role="group" aria-label="Escolha o horário">
                    {slots.map((item) => (
                      <button type="button" className={time === item ? "selected" : ""} onClick={() => setTime(item)} key={item}>{item}</button>
                    ))}
                  </div>
                )}
                {availabilityStatus === "ready" && slots.length === 0 && (
                  <p className="booking-state" role="status">
                    Não há horários livres nesta data. Escolha outro dia.
                  </p>
                )}
                {availabilityStatus === "error" && (
                  <p className="booking-state is-error" role="alert">
                    Não foi possível consultar a agenda. Selecione outra data ou tente novamente.
                  </p>
                )}
                <p className="slot-note">Os horários exibidos consideram a duração do serviço e a agenda do profissional.</p>
                <div className="booking-nav">
                  <Button variant="ghost" onClick={() => setStep(2)}>← Voltar</Button>
                  <Button className="booking-next" onClick={() => setStep(4)} disabled={!time}>
                    Informar meus dados <span>→</span>
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              confirmed ? (
                <div className="step-panel confirmation">
                  <p className="step-kicker">Reserva confirmada</p>
                  <h3>Sua cadeira está pronta.</h3>
                  <p className="confirmation-copy">O horário já está na agenda da Imperial. Se quiser, envie o resumo para o WhatsApp da barbearia.</p>
                  <dl>
                    <div><dt>Serviço</dt><dd>{service?.name}</dd></div>
                    <div><dt>Especialista</dt><dd>{barber?.name}</dd></div>
                    <div><dt>Quando</dt><dd>{day?.label}, {time}</dd></div>
                    <div><dt>Total</dt><dd>{service ? money(service.price) : "—"}</dd></div>
                    <div><dt>Reserva</dt><dd>#{appointmentId?.slice(0, 8)}</dd></div>
                  </dl>
                  <button type="button" className="whatsapp-action" onClick={openWhatsAppSummary}>Enviar resumo no WhatsApp <span>↗</span></button>
                  <button type="button" className="restart" onClick={restartBooking}>Fazer outro agendamento</button>
                </div>
              ) : (
                <form className="step-panel booking-form" onSubmit={submitBooking}>
                  <p className="step-kicker">Último detalhe</p>
                  <h3>Como falamos com você?</h3>
                  <div className="booking-form-fields">
                    <label>
                      <span>Nome completo</span>
                      <input value={clientName} onChange={(event) => setClientName(event.target.value)} autoComplete="name" minLength={2} maxLength={120} required />
                    </label>
                    <label>
                      <span>WhatsApp</span>
                      <input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" minLength={8} maxLength={40} placeholder="(11) 99999-9999" required />
                    </label>
                    <label className="is-wide">
                      <span>E-mail <small>opcional</small></span>
                      <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" type="email" maxLength={254} />
                    </label>
                    <label className="booking-honeypot" aria-hidden="true">
                      <span>Site</span>
                      <input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                  <div className="booking-review">
                    <span>{service?.name}</span>
                    <strong>{barber?.name} · {day?.label} · {time}</strong>
                  </div>
                  {bookingError && <p className="booking-error" role="alert">{bookingError}</p>}
                  <div className="booking-nav">
                    <Button type="button" variant="ghost" onClick={() => setStep(3)} disabled={isSubmitting}>← Voltar</Button>
                    <Button type="submit" className="booking-next" disabled={isSubmitting}>
                      {isSubmitting ? "Confirmando…" : "Confirmar reserva"} <span>→</span>
                    </Button>
                  </div>
                </form>
              )
            )}
          </div>
          {!confirmed && service && barber && (
            <footer className="booking-summary">
              <span>Seu ritual</span>
              <strong>{service.name}</strong>
              <span>{barber.name} · {day?.label}{time ? ` · ${time}` : ""}</span>
              <b>{money(service.price)}</b>
            </footer>
          )}
        </div>
      </section>

      <section className="location" id="localizacao" data-scroll="section">
        <div className="location-map" data-scroll="image">
          <iframe title="Mapa da região da Imperial Barber" src={`https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <span>23°33′43″S / 46°40′11″W</span>
        </div>
        <div className="location-info" data-scroll="title">
          <div className="section-index">05 / Visite</div>
          <p className="kicker">Jardins, São Paulo</p>
          <h2>Um intervalo<br />bem localizado.</h2>
          <address>{settings.address}<small>(endereço conceitual)</small></address>
          <a className="directions" href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`} target="_blank" rel="noreferrer">Ver região ↗</a>
          <div className="hours">
            <div><span>Funcionamento</span><strong>{settings.openingHours}</strong></div>
            <div><span>Telefone</span><strong>{settings.phone}</strong></div>
            <div><span>WhatsApp</span><strong>{settings.whatsapp}</strong></div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark footer-emblem"><ImperialMonogram /></span><span className="brand-copy"><strong>Imperial</strong><small>Barber · São Paulo</small></span></a>
        <p>O ofício de cuidar,<br />sem perder a medida.</p>
        <div className="footer-links"><a href="#servicos">Serviços</a><a href="#agenda">Agenda</a><a href="#localizacao">Localização</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram ↗</a></div>
        <div className="footer-bottom">
          <span>© 2026 Imperial Barber</span>
          <span>São Paulo — Brasil</span>
          <div className="footer-bottom-links">
            <Link className="footer-admin-link" href="/admin">
              Área administrativa <span aria-hidden="true">→</span>
            </Link>
            <a href="#inicio">Voltar ao topo ↑</a>
          </div>
        </div>
      </footer>
      <Toaster position="bottom-right" />
    </main>
  );
}
