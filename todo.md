# ADCMS Pro - Development TODO

## Phase 1: Database Schema & Data Models
- [ ] Aircraft table (registration, model, location, status)
- [ ] Defects table (aircraft_id, source, description, status, created_at)
- [ ] MEL items table (defect_id, category, reference, expiry_date, created_at)
- [ ] Cabin defects table (aircraft_id, area, description, is_mel, created_at)
- [ ] Action logs table (defect_id, action_taken, next_action, engineer_id, timestamp)
- [ ] Spare parts inventory table (part_code, description, quantity, location)
- [ ] Run migrations and verify schema

## Phase 2: Backend tRPC Procedures
- [ ] Aircraft procedures (list, get, update status)
- [ ] Defect procedures (create, list, update, close, delete)
- [ ] MEL procedures (create, list, update, calculate expiry)
- [ ] Cabin defect procedures (create, list, convert to MEL)
- [ ] Action log procedures (create, list by defect)
- [ ] Spare parts procedures (list, create, update, delete)
- [ ] Implement role-based access control (Super Admin, MCC Engineer, Cabin Dept)
- [ ] Write vitest tests for critical procedures

## Phase 3: Frontend Pages
- [ ] Fleet Overview Dashboard (aircraft cards with live counters)
- [ ] Defect Control Panel (expandable aircraft cards with defects)
- [ ] New Defect Form (all required fields)
- [ ] MEL Management Module (edit MEL details, auto-calculate expiry)
- [ ] Cabin Defects Module (log issues, convert to MEL)
- [ ] MCC Center (read-only view with MEL editing capability)
- [ ] Role-based UI restrictions (show/hide features based on user role)

## Phase 4: MEL & Action Logging
- [ ] MEL expiry calculation logic (A=immediate, B=3 days, C=10 days, D=120 days, Connection 1/2=custom)
- [ ] Action log creation on defect creation/update
- [ ] Display action history per defect
- [ ] Real-time updates when defects are modified

## Phase 5: Stores & Inventory
- [ ] Stores & Inventory page (list, create, update, delete spare parts)
- [ ] Inventory search and filtering
- [ ] Low stock alerts (optional)

## Phase 6: Testing & Delivery
- [ ] Test all CRUD operations
- [ ] Verify role-based access control enforcement
- [ ] Test real-time data sync across multiple users
- [ ] Performance testing with large datasets
- [ ] Create initial checkpoint
- [ ] Deliver to user with documentation

## Features Completed
- [x] Project initialized with web-db-user scaffold
- [x] Database connection established
- [x] User authentication with Manus OAuth
- [x] Role field added to users table

## Known Issues
- None yet

## Notes
- All data must be stored in MySQL, no localStorage
- MEL expiry dates must be calculated server-side
- Role-based access control must be enforced at procedure level
- Real-time updates should use database queries (no WebSockets needed for MVP)
