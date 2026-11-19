# Secuencia 030 · Landing y sitio corporativo

> Spec: [030-landing-corporativo](../../specs/030-landing-corporativo/spec.md)

```mermaid
sequenceDiagram
  autonumber
  actor V as Visitante
  participant B as Navegador
  participant P as Proxy Next
  participant N as Next App
  participant API as API NestJS

  V->>B: GET /
  B->>P: Solicita la home
  P->>P: Comprueba la cookie de sesión

  alt Sin sesión
    P->>N: Rewrite a /landing
    N-->>B: HTML de la landing + metadata
    B-->>V: Hero, capacidades, pasos y CTAs
  else Con sesión
    P->>N: Render de /
    N->>API: GET /dashboard
    API-->>N: Proyectos y actividad
    N-->>B: Dashboard autenticado
    B-->>V: Dashboard
  end

  V->>B: Pulsa “Crear cuenta” o “Iniciar sesión”
  B->>N: GET /register o /login
  N-->>B: Página de acceso
  V->>B: Abre /empresa
  B->>N: GET /empresa
  N-->>B: Placeholder corporativo
```

## Notas

- La landing y `/empresa` son públicas y no consultan endpoints privados.
- El dashboard en `/` conserva el comportamiento para usuarios autenticados.
- El rewrite de `/` solo aplica a visitantes sin sesión.
- La landing y la página corporativa comparten header, footer, logos y tokens.
- No hay cambios de API, Prisma ni autenticación.
