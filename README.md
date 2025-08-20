# Generador de Presentaciones PowerPoint con IA

Sistema que permite generar presentaciones PowerPoint automáticamente usando el API de Gemini AI.

## Características

- **Generación automática**: Ingresa un tema y obtén una presentación completa
- **IA avanzada**: Utiliza Gemini AI para crear contenido relevante y estructurado
- **Interfaz moderna**: Diseño responsive y fácil de usar
- **Vista previa**: Muestra el contenido antes de descargar
- **Descarga directa**: Archivo PowerPoint listo para usar

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor:
```bash
npm start
```

O para desarrollo:
```bash
npm run dev
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tu API key de Gemini
```

4. Abrir el navegador en `http://localhost:3001`

## Deploy en Render/Railway/Vercel

1. Conectar tu repositorio GitHub
2. Configurar variable de entorno: `GEMINI_API_KEY`
3. Deploy automático

## Variables de Entorno Requeridas

- `GEMINI_API_KEY`: Tu API key de Gemini AI
- `PORT`: Puerto del servidor (opcional, default: 3001)
- `NODE_ENV`: Entorno de ejecución (opcional)

## Uso

1. Ingresa un tema o descripción en el campo de texto
2. Haz clic en "Generar Presentación"
3. Espera a que la IA genere el contenido
4. Descarga tu presentación PowerPoint

## Estructura del Proyecto

```
├── server.js          # Servidor principal con API endpoints
├── package.json       # Dependencias del proyecto
├── public/
│   ├── index.html     # Interfaz web principal
│   ├── app.js         # Lógica del frontend
│   ├── style.css      # Estilos personalizados
│   └── downloads/     # Carpeta para archivos generados
└── README.md
```

## API Endpoints

- `POST /api/generate-presentation`: Genera una nueva presentación
- `GET /api/health`: Verificar estado del servidor

## Dependencias Principales

- **Express**: Servidor web
- **Axios**: Cliente HTTP para Gemini API  
- **Officegen**: Generación de archivos PowerPoint
- **Bootstrap**: Framework CSS para UI

## Configuración

El sistema usa el API key de Gemini AI configurado en el código. Para usar tu propia key, modifica la variable `GEMINI_API_KEY` en `server.js`.

## Notas

- Las presentaciones se generan con 6 diapositivas por defecto
- Los archivos se guardan temporalmente en `public/downloads/`
- Compatible con Node.js 14 o superior