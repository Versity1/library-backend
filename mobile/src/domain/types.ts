export type UserRole = 'STUDENT' | 'LIBRARIAN' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  role: UserRole;
  department?: string;
  student_staff_id: string;
  borrowing_limit: number;
}

export interface BookCopy {
  id: string;
  book: string;
  qr_code_id: string;
  status: 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'MAINTENANCE' | 'LOST';
  condition_notes?: string;
  added_at: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category?: number;
  category_name?: string;
  department?: string;
  publisher?: string;
  publication_year?: number;
  description?: string;
  cover_image_url?: string;
  location_shelf: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
  copies?: BookCopy[];
}

export interface Transaction {
  id: string;
  user: string;
  user_name: string;
  student_staff_id: string;
  book_copy: string;
  book_title: string;
  author: string;
  isbn: string;
  cover_image_url?: string;
  qr_code_id: string;
  issued_by?: string;
  issue_date: string;
  due_date: string;
  due_days_left?: number;
  return_date?: string;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
  renewed_count: number;
  request_status?: 'NONE' | 'PENDING_EXTENSION' | 'PENDING_RETURN' | 'APPROVED' | 'REJECTED';
  request_message?: string;
  fine_assessed?: {
    fine_id: string;
    amount: number;
    overdue_days: number;
  };
}

export interface Fine {
  id: string;
  transaction: string;
  user: string;
  user_name: string;
  book_title: string;
  author: string;
  amount: number;
  overdue_days: number;
  status: 'UNPAID' | 'PAID' | 'WAIVED';
  created_at: string;
  paid_at?: string;
}

export interface PaymentRecord {
  id: string;
  fine: string;
  fine_details?: Fine;
  user: string;
  amount_paid: number;
  payment_method: 'DIGITAL_WALLET' | 'CARD' | 'CASH';
  transaction_reference: string;
  paid_at: string;
}

export interface Reservation {
  id: string;
  user: string;
  user_name: string;
  student_staff_id: string;
  book: string;
  book_title: string;
  author: string;
  cover_image_url?: string;
  status: 'PENDING' | 'READY_FOR_PICKUP' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  queue_position: number;
  expiry_date?: string;
  created_at: string;
}

export interface Policy {
  id: number;
  role: UserRole;
  max_borrow_limit: number;
  default_loan_days: number;
  fine_rate_per_day: string | number;
  grace_period_days: number;
  reservation_hold_hours: number;
  updated_at: string;
}

export interface AnalyticsOverview {
  users: {
    total_students: number;
    total_staff: number;
  };
  catalog: {
    total_titles: number;
    total_copies: number;
    available_copies: number;
    utilization_rate_pct: number;
  };
  operations: {
    active_loans: number;
    overdue_loans: number;
    pending_reservations: number;
  };
  financials: {
    total_fines_collected: number;
    outstanding_unpaid_fines: number;
  };
}
