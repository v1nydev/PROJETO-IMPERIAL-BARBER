export type EntityId = string;
export type ISODate = string;
export type ISOTime = string;
export type ISOTimestamp = string;

export type UserRole = "admin" | "barber";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface User {
  id: EntityId;
  authUserId: EntityId;
  role: UserRole;
  name: string;
  email: string;
  active: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface Barber {
  id: EntityId;
  userId: EntityId | null;
  name: string;
  slug: string;
  specialty: string;
  bio: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface Client {
  id: EntityId;
  name: string;
  phone: string;
  email: string | null;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface Service {
  id: EntityId;
  name: string;
  description: string;
  durationMinutes: number;
  priceInCents: number;
  active: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface Appointment {
  id: EntityId;
  clientId: EntityId;
  barberId: EntityId;
  serviceId: EntityId;
  appointmentDate: ISODate;
  startTime: ISOTime;
  endTime: ISOTime;
  priceInCents: number;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface BarberAvailability {
  id: EntityId;
  barberId: EntityId;
  dayOfWeek: DayOfWeek;
  startTime: ISOTime;
  endTime: ISOTime;
  active: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}
