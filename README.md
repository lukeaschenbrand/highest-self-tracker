# Web App

A modern web application built with React and Vite.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Create a production build:

```bash
npm run build
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Tech Stack

- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **ESLint** - Code linting

## Adding shadcn/ui Components

This project is configured for shadcn/ui. To add components, use the shadcn/ui CLI:

```bash
npx shadcn-ui@latest add [component-name]
```

For example:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

Components will be added to `src/components/ui/` and can be imported like:
```jsx
import { Button } from "@/components/ui/button"
```

## Project Structure

```
webapp/
├── src/
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   │   └── utils.js     # Utility functions (cn helper)
│   ├── hooks/           # Custom React hooks
│   ├── App.jsx           # Main app component
│   ├── App.css           # App styles
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles (Tailwind + shadcn/ui)
├── components.json       # shadcn/ui configuration
├── tailwind.config.cjs   # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies and scripts
```

