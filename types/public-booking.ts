export type PublicService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
};

export type PublicBarber = {
  id: string;
  name: string;
  specialty: string;
  avatarUrl: string | null;
};

export type PublicShopSettings = {
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  openingHours: string;
  description: string;
};

export type PublicCatalog = {
  services: PublicService[];
  barbers: PublicBarber[];
  settings: PublicShopSettings | null;
};

