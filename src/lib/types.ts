export type InventoryStatus = "available" | "reserved" | "sold";
export type PublicationStatus = "draft" | "published" | "archived";

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  storage_path: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  slug: string;
  make: string;
  model: string;
  variant: string | null;
  model_year: number;
  manufacturing_year: number | null;
  price_inr: number;
  negotiable: boolean | null;
  odometer_km: number | null;
  fuel_type: string | null;
  transmission: string | null;
  body_type: string | null;
  colour: string | null;
  ownership_count: number | null;
  registration_city: string | null;
  registration_state: string | null;
  description: string | null;
  features: string[];
  service_history: string | null;
  inspection_notes: string | null;
  insurance_expiry: string | null;
  inventory_status: InventoryStatus;
  publication_status: PublicationStatus;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  sold_at: string | null;
  archived_at: string | null;
}

export interface VehicleWithRelations extends Vehicle {
  images: VehicleImage[];
}
