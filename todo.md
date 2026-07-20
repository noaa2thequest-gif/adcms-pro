# ADCMS Pro - Development TODO

## Phase 1: Database Schema & Data Models
- [x] Aircraft table (registration, model, location, status)
- [x] Defects table (aircraft_id, source, description, status, created_at)
- [x] MEL items table (defect_id, category, reference, expiry_date, created_at)
- [x] Cabin defects table (aircraft_id, area, description, is_mel, created_at)
- [x] Action logs table (defect_id, action_taken, next_action, engineer_id, timestamp)
- [x] Spare parts inventory table (part_code, description, quantity, location)
- [x] Run migrations and verify schema

## Phase 2: Backend tRPC Procedures
- [x] Aircraft procedures (list, get, update status)
- [x] Defect procedures (create, list, update, close, delete)
- [x] MEL procedures (create, list, update, calculate expiry)
- [x] Cabin defect procedures (create, list, convert to MEL)
- [x] Action log procedures (create, list by defect)
- [x] Spare parts procedures (list, create, update, delete)
- [x] Implement role-based access control (Super Admin, MCC Engineer, Cabin Dept)
- [ ] Write vitest tests for critical procedures

## Phase 3: Frontend Pages
- [x] Fleet Overview Dashboard (aircraft cards with live counters)
- [x] Defect Control Panel (expandable aircraft cards with defects)
- [x] New Defect Form (all required fields)
- [x] MEL Management Module (edit MEL details, auto-calculate expiry)
- [x] Cabin Defects Module (log issues, convert to MEL)
- [x] MCC Center (read-only view with MEL editing capability)
- [x] Aircraft Detail view (comprehensive aircraft information)
- [x] Stores & Inventory page (spare parts management)
- [ ] Role-based UI restrictions (show/hide features based on user role)
- [ ] Navigation/Sidebar for page access

## Phase 4: MEL & Action Logging
- [x] MEL expiry calculation logic (A=immediate, B=3 days, C=10 days, D=120 days, Connection 1/2=custom)
- [x] Action log creation on defect creation/update
- [ ] Display action history per defect
- [ ] Real-time updates when defects are modified

## Phase 5: Stores & Inventory
- [x] Stores & Inventory page (list, create, update, delete spare parts)
- [ ] Inventory search and filtering
- [ ] Low stock alerts (optional)

## Phase 6: Testing & Delivery
- [ ] Test all CRUD operations
- [ ] Verify role-based access control enforcement
- [ ] Test real-time data sync across multiple users
- [ ] Performance testing with large datasets
- [x] Create initial checkpoint
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


## Phase 7: Bug Fixes & Refinements
- [x] Add defect.delete procedure and UI
- [x] Add sparePart.delete procedure and UI
- [x] Navigation/Sidebar for page access
- [x] Fix Aircraft Detail routing (wire /aircraft/:id route)
- [x] Fix MEL Management placeholder data (getAircraftName)
- [x] Implement MEL expiry recalculation on category change
- [ ] Add automatic action log creation on defect create/update/close
- [ ] Support custom Connection 1/2 MEL expiry input
- [x] Validate MEL-required fields in New Defect Form
- [ ] Persist and use openDate field in defects
- [ ] Tighten RBAC enforcement across all procedures
- [x] Implement role-based UI restrictions (show/hide features)
- [x] Add inventory search and filtering
- [x] Add low stock alerts to Stores page
- [x] Display action history per defect on detail view
- [x] Write vitest tests for critical procedures
