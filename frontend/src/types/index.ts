export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface CustomerNote {
  id: string;
  customerId: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  customerType: CustomerType;
  address?: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  followUps?: CustomerNote[];
  _count?: {
    challans: number;
    followUps: number;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
  movements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
  createdAt: string;
  product?: {
    name: string;
    sku: string;
    category: string;
  };
}

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: ChallanItem[];
}
