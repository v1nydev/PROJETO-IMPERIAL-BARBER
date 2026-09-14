import { notFound } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Scissors,
  Settings2,
  UsersRound,
} from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const sections = {
  agenda: {
    title: "Agenda",
    eyebrow: "Operação diária",
    description: "Visualize os horários e a rotina da barbearia.",
    emptyTitle: "Nenhum horário carregado.",
    emptyDescription:
      "A visualização da agenda será implementada na etapa dedicada.",
    icon: CalendarDays,
  },
  agendamentos: {
    title: "Agendamentos",
    eyebrow: "Atendimentos",
    description: "Consulte e gerencie os atendimentos dos clientes.",
    emptyTitle: "Nenhum agendamento carregado.",
    emptyDescription:
      "A gestão dos atendimentos será implementada na etapa dedicada.",
    icon: CalendarRange,
  },
  servicos: {
    title: "Serviços",
    eyebrow: "Menu da casa",
    description: "Organize serviços, duração e valores.",
    emptyTitle: "Nenhum serviço carregado.",
    emptyDescription:
      "A gestão do catálogo será implementada na etapa dedicada.",
    icon: Scissors,
  },
  profissionais: {
    title: "Profissionais",
    eyebrow: "Equipe",
    description: "Acompanhe os profissionais da Imperial Barber.",
    emptyTitle: "Nenhum profissional carregado.",
    emptyDescription:
      "A gestão da equipe será implementada na etapa dedicada.",
    icon: UsersRound,
  },
  configuracoes: {
    title: "Configurações",
    eyebrow: "Preferências",
    description: "Ajuste as definições operacionais da barbearia.",
    emptyTitle: "Nenhuma configuração disponível.",
    emptyDescription:
      "As preferências serão adicionadas conforme os módulos forem construídos.",
    icon: Settings2,
  },
} as const;

type AdminSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function AdminSectionPage({
  params,
}: AdminSectionPageProps) {
  const { section } = await params;
  const details = sections[section as keyof typeof sections];

  if (!details) {
    notFound();
  }

  const Icon = details.icon;

  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <p className="admin-page-kicker">{details.eyebrow}</p>
        <h1>{details.title}</h1>
        <p>{details.description}</p>
      </header>

      <section
        className="admin-workspace"
        aria-labelledby={`${section}-empty-title`}
      >
        <Empty className="admin-empty-state">
          <EmptyMedia variant="icon">
            <Icon aria-hidden="true" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle id={`${section}-empty-title`}>
              {details.emptyTitle}
            </EmptyTitle>
            <EmptyDescription>{details.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>
    </div>
  );
}
