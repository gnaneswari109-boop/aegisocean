# AegisOcean

AegisOcean is a modern React + TypeScript dashboard for monitoring and analyzing oceanic anomalies, environmental patterns, and maritime intelligence. The application brings together overview metrics, anomaly mapping, and deep-dive analysis in a clean, interactive interface.

## Overview

This repository contains the frontend application for AegisOcean, built with Vite, React, Tailwind CSS, and 3D visualization tooling. It is designed to help users:

- monitor high-level system and ocean conditions,
- explore anomaly patterns on a map,
- inspect analysis details for a specific region or dataset,
- visualize seabed and spatial information with immersive 3D components.

## Features

- Overview dashboard with summary information
- Analysis page for deeper investigation and data review
- Anomaly map visualization for geographic insight
- 3D seafloor rendering using Three.js and React Three Fiber
- Responsive UI with Tailwind CSS
- Route-based navigation for different sections of the app

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Three.js
- @react-three/fiber
- @react-three/drei
- Supabase client
- Lucide React

## Project Structure

```text
.
├── project/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── router.ts
│   │   ├── types.ts
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── dist/
└── README.md
```

## Getting Started

1. Clone the repository
2. Open the app directory
3. Install dependencies
4. Start the development server

```bash
git clone https://github.com/gnaneswari109-boop/aegisocean.git
cd aegisocean/project
npm install
npm run dev
```

The app will be available in the Vite dev server, typically at:

```text
http://localhost:5173
```

## Available Scripts

```bash
npm run dev      # start the development server
npm run build    # build the production bundle
npm run preview  # preview the production build locally
npm run lint     # run ESLint
npm run typecheck # run TypeScript type checking
```

## Notes

This project currently uses the `project/` folder as the actual application root. If you are contributing or running the app locally, make sure to work from that directory.

## License

This project does not currently include a license file. If you plan to publish or share the project publicly, consider adding an appropriate open-source license.
