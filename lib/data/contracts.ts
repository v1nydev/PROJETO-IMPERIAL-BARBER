import type {
  Appointment,
  Barber,
  BarberAvailability,
  BarberAvailabilityException,
  Client,
  EntityId,
  Service,
  User,
} from "@/types/domain";

/**
 * Minimal read boundary shared by domain repositories.
 * Feature-specific queries and mutations are added only in their roadmap stage.
 */
export interface ReadRepository<TEntity> {
  getById(id: EntityId): Promise<TEntity | null>;
}

/**
 * The application depends on these contracts, not directly on Supabase calls.
 * Concrete adapters will be introduced alongside the features that need them.
 */
export interface DomainRepositories {
  users: ReadRepository<User>;
  barbers: ReadRepository<Barber>;
  clients: ReadRepository<Client>;
  services: ReadRepository<Service>;
  appointments: ReadRepository<Appointment>;
  barberAvailability: ReadRepository<BarberAvailability>;
  barberAvailabilityExceptions: ReadRepository<BarberAvailabilityException>;
}
