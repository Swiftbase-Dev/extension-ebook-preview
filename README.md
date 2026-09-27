# E-book Sample Preview Widget Extension for SBCMS

A standalone extension for SBCMS that provides an interactive book sample excerpt reader widget. Authors and store owners can drag the widget onto any landing page or store page using the Page Designer.

## Features
- **Responsive Book Header**: Displays cover art, title, author, and sample badge.
- **Reading Controls**: Instant font size adjustment (A- / A+) and Light/Dark reader theme toggle.
- **Store Conversion CTA**: Direct "Buy Full Book" button linking to the product checkout page.
- **Embeddable Web Component**: Custom element `<cms-ebook-preview-widget>` that renders seamlessly in both static pages and modern web apps.

## Manifest Configuration
Declared in `manifest.json`:
- `id`: `ebook-preview`
- `permissions`: `["ui:designer:block"]`
- `widgets`:
  - `id`: `ebook-preview-widget`
  - `label`: `E-book Preview Reader`
  - `script`: `dist/widget.js`
