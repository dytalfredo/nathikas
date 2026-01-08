# Documento de Especificación de Requerimientos - Nathikas

**Versión:** 1.0  
**Autor:** Alfredo Mendoza 
**Fecha:** 8 de enero de 2026

## 1. Introducción
Este documento detalla los requerimientos funcionales y no funcionales del sistema Nathikas, una plataforma de comercio electrónico especializada en la venta de gomitas picantes y chamoy, que integra una gestión administrativa robusta para el control de pedidos, producción y analítica.

---

## 2. Requerimientos Funcionales (RF)

### 2.1 Módulo de Tienda (Storefront)
*   **RF-01: Catálogo Dinámico:** El sistema debe mostrar los productos disponibles, permitiendo visualizar nombre, precio, descripción e imagen.
*   **RF-02: Gestión de Carrito:** Los usuarios deben poder agregar, eliminar y modificar la cantidad de productos en su carrito de compras en tiempo real.
*   **RF-03: Sistema de Descuentos por Volumen:** El sistema debe aplicar automáticamente descuentos basados en la cantidad de productos:
    *   Nivel 1: Aplicable a partir de 7 unidades.
    *   Nivel 2: Aplicable a partir de 13 unidades.
*   **RF-04: Resumen de Compra:** Visualización clara del subtotal, porcentaje de descuento aplicado y total final antes de proceder al checkout.

### 2.2 Proceso de Checkout (Flujo de Orden)
*   **RF-05: Checkout Multi-paso:** Implementación de un flujo guiado para capturar datos de facturación, envío y pago.
*   **RF-06: Persistencia de Datos (Cliente):** Captura obligatoria de Nombre, Teléfono, Cédula de Identidad y Correo Electrónico.
*   **RF-07: Gestión de Regalos (Recipient Separation):** Opción para que el comprador especifique datos de un receptor distinto (Nombre, Teléfono, Cédula) en caso de regalo.
*   **RF-08: Gestión de Envíos:** Selección de Estado y Ciudad, con integración de agencias de envío nacionales (MRW / Zoom).
*   **RF-09: Métodos de Pago:** Soporte para múltiples métodos:
    *   Pago Móvil (con captura de banco y referencia).
    *   Zelle (con captura de nombre del titular y correo).
*   **RF-10: Integración con WhatsApp:** Generación de un mensaje estructurado con todos los detalles del pedido (productos, datos de envío, datos de pago) para ser enviado vía API de WhatsApp.

### 2.3 Usuarios y Autenticación
*   **RF-11: Autenticación con Google:** Integración de Firebase Auth para permitir el inicio de sesión único con Google Account.
*   **RF-12: Perfil de Usuario Persistente:** Sincronización automática de datos personales (Cédula, Teléfono) tras el primer pedido exitoso o login social.
*   **RF-13: Auto-llenado de Formularios:** Si un usuario está autenticado, el sistema debe pre-cargar sus datos en el checkout para agilizar la compra.

### 2.4 Panel Administrativo (Dashboard)
*   **RF-14: Control de Acceso Basado en Roles (RBAC):** Restricción de acceso según el tipo de usuario:
    *   **Administrador:** Acceso total a todas las funciones.
    *   **Asistente:** Gestión de pedidos, producción e inventario.
    *   **Vendedor:** Gestión de pedidos e inventario.
*   **RF-15: Gestión de Estados de Pedido:** Actualización del ciclo de vida del pedido: Pendiente → Pagado → Despachado → Entregado → Cancelado.
*   **RF-16: Sistema de Sincronización de Producción:** Generación automática de necesidades de producción (Gomitas, Chamoy, Etiquetas) a partir de los pedidos pagados que no han sido despachados.
*   **RF-17: Configuración Global (Global Settings):** Interfaz para modificar dinámicamente datos bancarios de Zelle, Pago Móvil y credenciales de servicios externos (SensiBot).
*   **RF-18: Dashboard de Reportes (Business Intelligence):** Visualización de métricas clave:
    *   Ingresos totales y ticket promedio.
    *   Gráficos de actividad de ventas mensuales.
    *   Ranking de los 5 productos más vendidos.
*   **RF-19: Gestión de Personal:** Interfaz para que el administrador pueda crear nuevas cuentas de usuario con roles específicos (vendedor, asistente, administrador).
*   **RF-20: Herramientas de Desarrollador (Danger Zone):** Función exclusiva para desarrolladores/administradores raíz que permite la limpieza selectiva de las colecciones de la base de datos (pedidos, producciones, etc.), preservando la cuenta del administrador actual.

---

## 3. Requerimientos No Funcionales (RNF)

### 3.1 Rendimiento y Escalabilidad
*   **RNF-01: Arquitectura Astro:** Uso de Astro para generación estática y componentes de React para hidratación parcial, garantizando tiempos de carga ultrarrápidos y excelente SEO.
*   **RNF-02: Escalabilidad Vertical/Horizontal:** Uso de Google Firebase (Firestore y Auth) como backend serverless para manejar picos de tráfico sin necesidad de gestión de servidores manual.

### 3.2 Seguridad y Privacidad
*   **RNF-03: Reglas de Seguridad de Firestore:** Implementación de reglas granulares que aseguran que los clientes solo puedan leer/escribir sus propios perfiles y que los datos administrativos solo sean accesibles por personal autorizado.
*   **RNF-04: Cifrado en Tránsito:** Toda la comunicación entre el cliente y el servidor debe realizarse sobre protocolos HTTPS/TLS.

### 3.3 Usabilidad y Diseño (UX/UI)
*   **RNF-05: Diseño Premium y Adaptativo:** Interfaz construida con Tailwind CSS v4, asegurando una experiencia visual cohesiva y funcional tanto en móviles como en escritorio.
*   **RNF-06: Micro-animaciones:** Uso de Framer Motion para transiciones suaves que mejoran la percepción de calidad del sistema.
*   **RNF-07: Onboarding Interactivo:** Implementación de guías con Driver.js para reducir la curva de aprendizaje de nuevos administradores.

### 3.4 Confiabilidad y Disponibilidad
*   **RNF-08: Persistencia en Tiempo Real:** Uso de listeners de Firestore para que los cambios en el inventario o estados de pedidos se reflejen instantáneamente en el dashboard administrativo sin recargar la página.
*   **RNF-09: Manejo de Errores Robusto:** Implementación de alertas personalizadas y validaciones de formularios preventivas para evitar el envío de datos corruptos.

---

## 4. Tecnologías Utilizadas
*   **Frontend:** Astro, React 18.3.1, Tailwind CSS v4.
*   **Backend & Data:** Firebase (Firestore, Auth, Storage).
*   **Estado:** Zustand (Gestión global de carrito, alertas y autenticación).
*   **Animación:** Framer Motion.
*   **Iconografía:** Lucide React.
