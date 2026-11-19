# Spec 030 · Landing page y sitio corporativo

| Campo | Valor |
|---|---|
| ID | `030` |
| Estado | `Implementada con brechas` |
| Autor | Equipo Infinipaper |
| Fecha | `2026-11-18` |
| Origen | Presentación pública del producto y placeholder del sitio corporativo |
| Dependencias | `013`, `014`, `027`, `028`, `029` |

## 1. Contexto y problema

Infinipaper ya tiene una aplicación funcional, pero un visitante que llega a `/` sin sesión es redirigido directamente al login. No existe una página pública que explique qué es el producto, qué problema resuelve ni por qué usarlo. Tampoco existe una presencia corporativa que presente al equipo como empresa de desarrollo de software.

El material de referencia describe la sobrecarga documental académica, la lectura lineal poco eficiente y la oportunidad de usar IA para convertir material disperso en recursos de estudio. La landing debe comunicar esa idea de forma breve y visual.

## 2. Objetivo

> Como **visitante**, quiero **entender rápidamente qué es Infinipaper y qué puedo hacer con mi material de estudio**, para **decidir si creo una cuenta o inicio sesión**.

> Como **empresa**, quiero **tener una página corporativa provisional**, para **presentar la actividad de desarrollo de software mientras el sitio definitivo está en construcción**.

## 3. Alcance

### Incluye

- Landing pública para visitantes sin sesión.
- Rewrite de `/` a `/landing` cuando no hay cookie de sesión; el dashboard autenticado permanece en `/`.
- Secciones: hero, propuesta de valor, capacidades, cómo funciona, comunidad y CTA.
- Header y footer de marketing con logo, navegación, tema e inicio de sesión/registro.
- Página `/empresa` como placeholder corporativo.
- Copy inspirado levemente en la documentación de introducción/antecedentes.
- Diseño responsive, tema claro/oscuro y componentes existentes.
- Metadatos SEO para la landing y la página corporativa.
- Enlaces desde la landing a `/login`, `/register` y `/empresa`.
- Enlaces de la página corporativa de vuelta a la landing.

### No incluye

- Sitio corporativo completo con formulario de contacto funcional.
- CMS, blog, casos de éxito o portal de clientes.
- Analítica o tracking adicional.
- Internacionalización.
- Cambios en la API, la autenticación o el modelo de datos.
- Cambios en el dashboard autenticado.
- Nuevas dependencias.

## 4. Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | Un visitante sin sesión que entra a `/` ve la landing pública. | Must |
| RF-02 | Un usuario con sesión que entra a `/` sigue viendo el dashboard. | Must |
| RF-03 | La landing presenta el producto, el problema y la propuesta de valor. | Must |
| RF-04 | La landing muestra las capacidades principales: proyectos, apuntes, IA, quizzes, mapas, búsqueda y móvil. | Must |
| RF-05 | La landing explica el flujo “reúne, genera, estudia” en tres pasos. | Should |
| RF-06 | La landing tiene CTAs visibles a login y registro. | Must |
| RF-07 | La landing enlaza a `/empresa`. | Must |
| RF-08 | `/empresa` existe como placeholder corporativo de una empresa de desarrollo de software. | Must |
| RF-09 | `/empresa` permite volver a la landing. | Must |
| RF-10 | La landing y la página corporativa usan los logos y tokens de Infinipaper. | Must |
| RF-11 | El header y el footer se comparten entre las páginas públicas. | Should |
| RF-12 | La landing tiene metadatos de título y descripción. | Should |
| RF-13 | La landing no muestra datos privados ni requiere sesión. | Must |
| RF-14 | El dashboard y las rutas protegidas conservan su comportamiento actual. | Must |

## 5. Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | La landing es responsive desde 320 px. | Revisión visual y navegador. |
| RNF-02 | Respeta el tema claro/oscuro. | Revisión visual. |
| RNF-03 | El contraste de textos cumple AA. | Revisión visual y tokens. |
| RNF-04 | No se añaden dependencias ni cambios de API. | `git diff` y build. |
| RNF-05 | No hay scroll horizontal ni CTAs fuera de pantalla. | Revisión en 320, 768 y 1440 px. |
| RNF-06 | La landing carga sin consultar endpoints privados. | Revisión de red. |
| RNF-07 | `npm run lint` y `npm run build` pasan. | Comandos locales. |

## 6. Criterios de aceptación

### CA-01 · Visitante sin sesión

- **Dado** un visitante sin cookie de sesión,
- **cuando** abre `/`,
- **entonces** ve la landing con hero, capacidades y CTAs, sin ser redirigido al login.

### CA-02 · Usuario autenticado

- **Dado** un usuario con sesión,
- **cuando** abre `/`,
- **entonces** ve el dashboard actual.

### CA-03 · Navegación

- **Dado** la landing,
- **cuando** pulsa “Iniciar sesión”, “Crear cuenta” o “Empresa”,
- **entonces** navega a `/login`, `/register` o `/empresa`.

### CA-04 · Página corporativa

- **Dado** un visitante,
- **cuando** abre `/empresa`,
- **entonces** ve una presentación provisional de la empresa de desarrollo de software y un enlace para volver.

### CA-05 · Responsive

- **Dado** un ancho de 320 px,
- **cuando** se recorre la landing,
- **entonces** no hay scroll horizontal y los CTAs son usables.

### CA-06 · Tema

- **Dado** el tema oscuro,
- **cuando** se abre la landing,
- **entonces** fondos, textos, tarjetas y bordes usan la variante oscura.

### CA-07 · Sin regresión

- **Dado** el dashboard existente,
- **cuando** un usuario autenticado lo abre,
- **entonces** sus datos y acciones siguen funcionando.

## 7. Contratos e interfaces

### Rutas

| Ruta | Acceso | Comportamiento |
|---|---|---|
| `/` | Público/autenticado | Sin sesión: rewrite a `/landing`. Con sesión: dashboard. |
| `/landing` | Público | Landing de producto. |
| `/empresa` | Público | Placeholder corporativo. |
| `/login`, `/register` | Público | Sin cambios funcionales. |

### Datos

- Sin cambios de API, Prisma ni autenticación.
- El proxy de Next solo añade el rewrite de la home para visitantes.

### UI

- Componentes compartidos `MarketingHeader` y `MarketingFooter`.
- Landing con hero, mockup de producto, capacidades, pasos y CTA.
- Página corporativa con servicios, enfoque y aviso de “sitio en construcción”.
- Uso de `ThemeToggle`, `Button`, `Badge` y tokens existentes.

## 8. Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| Usuario con cookie inválida | La home mantiene el comportamiento actual del dashboard; no se introduce lógica de sesión nueva. |
| Visitante directo a `/landing` | Ve la landing. |
| Visitante directo a `/empresa` | Ve el placeholder. |
| Usuario autenticado en `/empresa` | Ve la página corporativa y puede volver. |
| JavaScript desactivado | El contenido principal sigue siendo HTML renderizado por Next. |
| Tema oscuro | La landing y la página corporativa se adaptan. |

## 9. Decisiones y preguntas abiertas

| ID | Decisión / pregunta | Estado |
|---|---|---|
| D-01 | Mantener el dashboard en `/` para autenticados y usar rewrite a `/landing` para visitantes. | Cerrada |
| D-02 | El copy se inspira en la documentación sin reproducir párrafos completos. | Cerrada |
| D-03 | `/empresa` es un placeholder público, no un formulario de contacto. | Cerrada |
| D-04 | No se añaden dependencias nuevas. | Cerrada |
| Q-01 | ¿El sitio corporativo tendrá nombre comercial propio? | Abierta (v1 usa “Infinipaper Software”) |
| Q-02 | ¿Se añadirá formulario de contacto o email real? | Abierta (v1: placeholder) |

## 10. Brechas conocidas

| ID | Brecha | Impacto | Tarea |
|---|---|---|---|
| G-01 | Sin formulario de contacto corporativo. | La página no capta leads todavía. | `T-090` |
| G-02 | Sin nombre comercial definitivo para la empresa. | Se usa “Infinipaper Software” como placeholder. | `T-091` |
| G-03 | Sin CMS para editar el copy. | Los cambios de texto requieren deploy. | `T-092` |

## 11. Evidencia de validación

| CA | Evidencia | Fecha |
|---|---|---|
| CA-01 | Visitante sin cookie: `/` mostró la landing (título “Infinipaper · Menos infoxicación, más comprensión”). | 2026-11-18 |
| CA-02 | Usuario autenticado: `/` mostró `Mi dashboard` y el header de la app. | 2026-11-18 |
| CA-03 | La landing enlazó a `/login`, `/register`, `/empresa`, `/#producto` y `/#como-funciona`. | 2026-11-18 |
| CA-04 | `/empresa` mostró “Sitio corporativo en construcción”, servicios y enlaces de vuelta. | 2026-11-18 |
| CA-05 | `scrollWidth === innerWidth` a 320, 768 y 1440 px; se corrigió el CTA móvil del header. | 2026-11-18 |
| CA-06 | Landing y página corporativa revisadas en tema claro y oscuro. | 2026-11-18 |
| CA-07 | El dashboard autenticado conservó su carga y navegación. | 2026-11-18 |
| RNF-01–RNF-07 | `npm run lint` y `npm run build` correctos; sin dependencias nuevas. | 2026-11-18 |
