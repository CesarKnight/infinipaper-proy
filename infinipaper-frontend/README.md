# infinipaper-frontend
App de Nextjs frontend para infinipaper, una app para condensar informacion en comunidad
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to load **Inter** (interfaz), **Fraunces** (títulos) and **Geist Mono** (código). Los tokens de color, tipografía y assets viven en [`infinipaper-design-system/`](../infinipaper-design-system/README.md); el tema aplicado está en `app/globals.css`.

## Design system and icons

- Paleta: Paper & Ink (claro) / Midnight Study (oscuro).
- Favicon, icon SVG, Apple Touch, Open Graph y manifiesto PWA usan los assets de `infinipaper-design-system/assets/web/`.
- Para regenerar iconos:

```bash
cd ../infinipaper-design-system
python3 scripts/generar-assets.py
python3 scripts/verificar-assets.py
```


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
