/**
 * TypeScript Type Definitions for Aurexia ERP
 */

export interface Role {
  id: number;
  name: string;
  can_view_prices: boolean;
  description?: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  badge_id?: string;
  role_id?: number;
  role?: Role;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  delivery_frequency?: string;
  is_active: boolean;
  created_at: string;
}

export interface PartNumber {
  id: number;
  part_number: string;
  customer_id?: number;
  customer?: Customer;
  description?: string;
  material_type?: string;
  unit_price?: number;
  is_active: boolean;
  created_at: string;
  routings?: PartRouting[];
  materials?: PartMaterial[];
}

export interface Material {
  id: number;
  name: string;
  type?: string;
  unit?: string;
  current_stock: number;
  minimum_stock?: number;
  is_active: boolean;
  created_at: string;
}

export interface PartMaterial {
  id: number;
  part_number_id: number;
  material_id: number;
  material?: Material;
  quantity: number;
  unit?: string;
  notes?: string;
  created_at: string;
}

export interface PartRouting {
  id: number;
  part_number_id: number;
  process_id: number;
  process?: Process;
  sequence_number: number;
  standard_time_minutes?: number;
}

export interface Process {
  id: number;
  code: string;
  name: string;
  description?: string;
  work_center_id: number;
}

export interface SalesOrder {
  id: number;
  po_number: string;
  customer_id: number;
  customer?: Customer;
  order_date: string;
  due_date: string;
  status: string;
  notes?: string;
  created_at: string;
  items: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: number;
  sales_order_id: number;
  part_number_id: number;
  part_number?: PartNumber;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  quantity_produced: number;
  quantity_shipped: number;
  status: string;
}

export interface ProductionOrder {
  id: number;
  po_number: string;
  sales_order_id?: number;
  part_number_id: number;
  part_number?: PartNumber;
  quantity: number;
  quantity_completed: number;
  quantity_scrapped: number;
  status: string;
  start_date?: string;
  due_date?: string;
  priority: string;
  created_at: string;
}

export interface TravelSheet {
  id: number;
  travel_sheet_number: string;
  production_order_id: number;
  qr_code: string;
  batch_number?: string;
  status: string;
  created_at: string;
  operations: TravelSheetOperation[];
}

export interface TravelSheetOperation {
  id: number;
  travel_sheet_id: number;
  process_id: number;
  process?: Process;
  sequence_number: number;
  qr_code: string;
  work_center_id: number;
  status: string;
  operator_id?: number;
  machine_id?: number;
  quantity_good: number;
  quantity_scrap: number;
  quantity_pending?: number;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  operator_notes?: string;
}

export interface DashboardStats {
  total_open_orders: number;
  total_completed_orders: number;
  total_shipped_orders: number;
  total_in_production: number;
  total_delayed: number;
  total_at_risk: number;
  total_on_time: number;
}

export interface ProductionDashboardItem {
  id: number;
  po_number: string;
  sales_order_number?: string;
  customer_name?: string;
  part_number: string;
  part_description?: string;
  quantity: number;
  quantity_completed: number;
  quantity_shipped: number;
  quantity_scrapped: number;
  status: string;
  due_date?: string;
  risk_status: 'Green' | 'Yellow' | 'Red';
  completion_percentage: number;
}

export interface QualityInspection {
  id: number;
  travel_sheet_id?: number;
  production_order_id: number;
  production_order?: ProductionOrder;
  inspector_id?: number;
  inspector?: User;
  inspection_date: string;
  status: string; // 'Released', 'Rejected', 'On Hold'
  quantity_inspected?: number;
  quantity_approved?: number;
  quantity_rejected?: number;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
}

export interface Shipment {
  id: number;
  shipment_number: string;
  customer_id: number;
  customer?: Customer;
  sales_order_id?: number;
  sales_order?: SalesOrder;
  shipment_date: string;
  status: string; // 'Prepared', 'Shipped', 'Delivered'
  tracking_number?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  items: ShipmentItem[];
}

export interface ShipmentItem {
  id: number;
  shipment_id: number;
  sales_order_item_id?: number;
  part_number_id: number;
  part_number?: PartNumber;
  production_order_id?: number;
  production_order?: ProductionOrder;
  quantity: number;
  unit_price?: number;
  created_at?: string;
}
