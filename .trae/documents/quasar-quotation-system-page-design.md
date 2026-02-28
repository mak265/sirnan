# Page Design (Desktop-first)

## Global Styles (All Pages)
- Layout system: CSS Grid for app shell; Flexbox for forms/toolbars.
- Spacing: 8px base spacing (8/16/24/32).
- Colors: background #0B1220; surface #111B2E; primary #4F8CFF; warning #F5A524; danger #E5484D; text #EAF0FF.
- Typography: Inter/System; H1 28/32, H2 20/28, body 14/20, monospace for SKU.
- Buttons: primary filled; secondary outline; disabled 40% opacity; hover brighten + subtle elevation.
- Tables: sticky header; row hover highlight; right-align currency.

## 1) Login
- Meta: title “Sign in • Quotation System”; description “Secure access to quotation management”.
- Structure: centered card on neutral background.
- Sections & components:
  - Brand header (logo + app name).
  - Email + password inputs, “Sign in” button.
  - “Forgot password” link (opens reset dialog / page).
  - Error banner (auth failure).

## 2) Quotes Dashboard (/quotes)
- Meta: title “Quotes • Quotation System”; description “Browse and manage quotes”.
- Page structure: app shell (top bar + left nav) + main content.
- Sections & components:
  - Top bar: search input, user menu.
  - Left nav: Quotes (active), Inventory, Customers.
  - Header row: page title + “New Quote” primary button.
  - Filters row: Status dropdown, date range, “Clear”.
  - Quotes table:
    - Columns: Quote #/ID, Customer, Status (pill), Total, Updated, Actions.
    - Row action: open quote detail.

## 3) Quote Editor / Detail (/quotes/:id)
- Meta: title “Quote {id} • Quotation System”; description “Edit quote items, status, and export PDF”.
- Page structure: two-column grid (main editor left, summary/right rail), collapses to stacked on small screens.
- Sections & components:
  - Breadcrumb: Quotes > Quote {id}.
  - Customer card:
    - Customer select (searchable); read-only contact/address preview.
  - Line items card:
    - “Add from Inventory” button opens product picker dialog (table: SKU, Name, Price, Stock, Select).
    - After selection: line item rows with quantity stepper, read-only unit price, line total.
    - Disallow manual editing of product name and unit price (read-only).
  - Stock warnings:
    - Inline warning badge per row when quantity > available stock.
    - Summary alert in right rail explaining which items violate the rule.
  - Right rail (sticky): totals breakdown, status selector, primary actions.
    - Status selector limited to allowed transitions.
    - When stock rule fails: disable “Mark as Sent” and “Final PDF Export”; show tooltip/message.
  - PDF export:
    - Buttons: “Download PDF” (always), “Final PDF Export” (blocked when rule fails, if configured).
    - PDF includes current status label and timestamp.

## 4) Inventory (/inventory)
- Meta: title “Inventory • Quotation System”; description “Manage products and stock on hand”.
- Page structure: table-centric admin page.
- Sections & components:
  - Header row: title + “New Product” button.
  - Search + filters: Active toggle, SKU/name search.
  - Products table:
    - Columns: SKU, Name, Unit Price, Stock On Hand, Active, Updated.
    - Inline edit for stock on hand (admin only) or edit drawer.
  - Product form (drawer/modal): SKU, name, unit price, active, stock on hand; validation errors.

## 5) Customers (/customers)
- Meta: title “Customers • Quotation System”; description “Manage customers used in quotes”.
- Page structure: list + detail drawer.
- Sections & components:
  - Header row: title + “New Customer”.
  - Customers table: name, email/phone, actions.
  - Customer form (drawer/modal): name (required), email/phone, address text.

## Shared Interaction Rules
- Loading states: skeleton rows for tables; button spinners for save/export.
- Errors: top-of-card banner + field-level helper text.
- Unsaved changes: confirm dialog when leaving Quote Editor with edits.
- Accessibility: keyboard navigable dialogs, visible focus ring, status pills with text + color.