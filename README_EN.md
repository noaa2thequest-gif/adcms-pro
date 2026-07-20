# ADCMS Pro - Aircraft Defect and Maintenance Control System

## Overview

**ADCMS Pro** is a comprehensive system for managing aircraft maintenance, defect control, and deferred maintenance items (MEL - Minimum Equipment List).

The system helps with:
- Fleet tracking and aircraft status management
- Defect registration and management
- Deferred maintenance (MEL) administration
- Maintenance action logging
- Spare parts and inventory management

---

## User Roles and Permissions

### Admin
- Full access to all features
- Delete defects and spare parts
- User management (future)
- Comprehensive reports

### MCC Engineer (Maintenance Control Center)
- Add and modify defects
- Manage deferred maintenance items
- Log maintenance actions
- Cannot delete defects
- Cannot access cabin defects

### Cabin Department
- Register cabin defects only
- Convert cabin defects to MEL
- Cannot access main maintenance defects

### Regular User
- View aircraft fleet only
- Cannot register defects
- Cannot access any management features

---

## Main Pages

### Home (`/`)
- Welcome screen
- Quick links to main pages
- System information

### Fleet Overview (`/fleet`)
- List of all aircraft
- Aircraft status (serviceable, unserviceable, AOG)
- Count of open defects
- Click on aircraft for details

### Defect Control (`/defect-control`)
- View open defects for each aircraft
- Close defects
- Log maintenance actions
- Delete defects (Admin only)
- View action history

### New Defect (`/new-defect`)
- Form to register new defect
- Select aircraft, source, and description
- Option to mark as MEL
- Select MEL category (A, B, C, D, Connection 1/2)

### Cabin Defects (`/cabin-defects`)
- Register cabin defects (seats, air conditioning, etc.)
- Convert cabin defects to MEL
- Select MEL category when converting

### MEL Management (`/mel-management`)
- View deferred items by status:
  - **Expired** (must be fixed immediately)
  - **Expiring Soon** (within 7 days)
  - **Active** (still valid)
- Edit MEL details
- Change category and recalculate expiry

### MCC Center (`/mcc-center`)
- Page for maintenance engineers only
- View all open, deferred, and closed defects
- Modify defect status
- Add notes

### Stores & Inventory (`/stores`)
- List of available spare parts
- Search and filter by part code or description
- Add new parts
- Modify quantities and locations
- Low stock alerts
- Delete parts (Admin only)

---

## Basic Workflow

### Register a New Defect:
1. Go to **New Defect**
2. Select aircraft
3. Enter defect source (Cabin, Maintenance, Technical)
4. Write defect description
5. If MEL defect:
   - Check "This is a MEL defect"
   - Select category (A=immediate, B=3 days, C=10 days, D=120 days)
6. Click "Add Defect"

### Close a Defect:
1. Go to **Defect Control**
2. Select aircraft
3. Click "Close Defect"
4. Or click "Add Action" to log what was done

### Convert Cabin Defect to MEL:
1. Go to **Cabin Defects**
2. Click "Convert to MEL"
3. Select MEL category
4. Enter reference number (optional)
5. Click "Convert"

---

## MEL Categories and Validity Periods

| Category | Meaning | Period |
|----------|---------|--------|
| **A** | Critical defect - fix immediately | Immediate |
| **B** | Important defect | 3 days |
| **C** | Medium defect | 10 days |
| **D** | Minor defect | 120 days |
| **Connection 1** | Related defects (type 1) | 30 days |
| **Connection 2** | Related defects (type 2) | 30 days |

---

## Security and Privacy

- Each user sees only pages they have access to
- Every operation is protected by permission checks
- Deleting defects and parts requires confirmation
- All actions are logged with timestamp and user

---

## Data Stored

### Aircraft Table:
- Registration number
- Aircraft model
- Current location
- Status (serviceable, unserviceable, AOG)

### Defects Table:
- Aircraft
- Source (Cabin, Maintenance, Technical)
- Description
- Status (open, closed, deferred)
- Registration date

### MEL Table:
- Related defect
- Category
- Reference number
- Expiry date

### Action Log Table:
- Related defect
- Action taken
- Next action
- Engineer
- Timestamp

### Spare Parts Table:
- Part code
- Description
- Available quantity
- Location
- Minimum stock level

---

## System Requirements

### Browser Requirements:
- Modern browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- User account

### Support:
- Contact support team for help or bug reports

---

## Technical Support

- **Email:** support@adcms.local
- **Phone:** +966-XX-XXXX-XXXX
- **Hours:** Saturday - Thursday, 8 AM - 5 PM

---

## Important Notes

1. **Data Saving:** All data is automatically saved to the database
2. **Backups:** Daily backups are performed
3. **Performance:** System supports thousands of defects and parts
4. **Scalability:** New features can be added as needed

---

**Last Updated:** July 2026
**Version:** 1.0.0
