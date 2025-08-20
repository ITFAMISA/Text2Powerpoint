const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const officegen = require('officegen');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración para producción
if (process.env.NODE_ENV === 'production') {
    // Configuraciones adicionales para producción
    app.set('trust proxy', 1);
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Verificar que el API key esté configurado
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY no está configurada en las variables de entorno');
    console.error('Crea un archivo .env con: GEMINI_API_KEY=tu_api_key_aqui');
    process.exit(1);
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

async function generateContentWithGemini(topic) {
    const prompt = `Crea una presentación informativa completa sobre "${topic}". 
    
    Genera contenido DETALLADO Y PRÁCTICO para una presentación PowerPoint de 6 diapositivas, donde cada punto sea un párrafo completo de 3-4 oraciones con información útil y bien desarrollada.
    
    REQUISITOS PARA CONTENIDO COMPLETO:
    - Cada punto debe ser un párrafo de 3-4 oraciones bien desarrollado
    - Incluye información práctica, datos interesantes, contexto relevante
    - Explica procesos, características, beneficios de forma clara
    - Incluye ejemplos concretos, aplicaciones reales, datos curiosos
    - Cada diapositiva debe tener 4-5 párrafos informativos
    - Mantén un tono informativo pero accesible, no excesivamente académico
    - Adapta el nivel de profundidad al tema (un tema médico será más técnico, un tema culinario más práctico)
    
    ESTRUCTURA FLEXIBLE (adapta según el tema):
    1. Introducción: Qué es, origen/historia, importancia o relevancia actual
    2. Características principales: Aspectos fundamentales, propiedades, elementos clave
    3. Proceso/Método/Funcionamiento: Cómo se hace, cómo funciona, pasos importantes
    4. Variedades/Tipos/Aplicaciones: Diferentes formas, usos, variaciones
    5. Beneficios/Ventajas/Aspectos positivos: Por qué es importante, qué aporta
    6. Conclusiones: Resumen, tendencias, futuro, recomendaciones
    
    EJEMPLOS de nivel apropiado según el tema:
    - Tema médico: Incluye datos clínicos, pero no excesivamente técnicos
    - Tema culinario: Historia, preparación, ingredientes, variaciones regionales
    - Tema tecnológico: Funcionamiento, beneficios, aplicaciones prácticas
    - Tema cultural: Orígenes, tradiciones, significado, evolución
    
    Formato JSON:
    {
        "title": "Título claro y descriptivo",
        "slides": [
            {
                "title": "Título informativo de la diapositiva",
                "content": [
                    "Párrafo informativo de 3-4 oraciones con información práctica y bien desarrollada, adaptada al nivel apropiado del tema...",
                    "Otro párrafo con ejemplos concretos, datos interesantes y explicaciones claras...",
                    "Párrafo con información útil, comparaciones o características importantes..."
                ]
            }
        ]
    }
    
    Responde SOLO con el JSON, sin texto adicional.`;

    try {
        const response = await axios.post(
            GEMINI_API_URL,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': GEMINI_API_KEY
                }
            }
        );

        const generatedText = response.data.candidates[0].content.parts[0].text;
        console.log('Respuesta completa de Gemini:', generatedText);
        
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            console.log('Datos parseados completos:', JSON.stringify(parsedData, null, 2));
            return parsedData;
        } else {
            throw new Error('No se pudo extraer JSON válido de la respuesta');
        }
    } catch (error) {
        console.error('Error al generar contenido:', error);
        throw error;
    }
}

function createPowerPoint(presentationData) {
    return new Promise((resolve, reject) => {
        const pptx = officegen('pptx');
        
        pptx.setSlideSize(1280, 720, 'screen16x9');

        presentationData.slides.forEach((slideData, index) => {
            const slide = pptx.makeNewSlide();
            
            slide.addText(slideData.title, {
                x: 50, y: 30, cx: 1180, cy: 80,
                font_size: 28,
                bold: true,
                color: '1F4E79'
            });

            if (slideData.content && slideData.content.length > 0) {
                // Unir todo el contenido en un solo bloque de texto con mejor formato
                const allContent = slideData.content.map(point => `• ${point}`).join('\n\n');
                
                slide.addText(allContent, {
                    x: 80, y: 130, cx: 1120, cy: 550,
                    font_size: 12,
                    color: '333333'
                });
            }
        });

        const filename = `presentation_${Date.now()}.pptx`;
        const filepath = path.join(__dirname, 'public', 'downloads', filename);

        if (!fs.existsSync(path.join(__dirname, 'public', 'downloads'))) {
            fs.mkdirSync(path.join(__dirname, 'public', 'downloads'), { recursive: true });
        }

        const output = fs.createWriteStream(filepath);
        pptx.generate(output);

        output.on('close', () => {
            resolve(filename);
        });

        output.on('error', (err) => {
            reject(err);
        });
    });
}

app.post('/api/generate-presentation', async (req, res) => {
    try {
        const { topic } = req.body;
        
        if (!topic) {
            return res.status(400).json({ error: 'El tema es requerido' });
        }

        console.log(`Generando presentación para el tema: ${topic}`);
        
        const presentationData = await generateContentWithGemini(topic);
        console.log('Contenido generado:', presentationData);
        
        const filename = await createPowerPoint(presentationData);
        console.log(`PowerPoint creado: ${filename}`);
        
        // Crear archivo .txt con el contenido completo
        const txtFilename = filename.replace('.pptx', '.txt');
        const txtFilepath = path.join(__dirname, 'public', 'downloads', txtFilename);
        
        let txtContent = `${presentationData.title}\n${'='.repeat(presentationData.title.length)}\n\n`;
        
        presentationData.slides.forEach((slide, index) => {
            txtContent += `Diapositiva ${index + 1}: ${slide.title}\n`;
            txtContent += '-'.repeat(slide.title.length + 15) + '\n';
            if (slide.content && slide.content.length > 0) {
                slide.content.forEach(point => {
                    txtContent += `• ${point}\n`;
                });
            }
            txtContent += '\n';
        });
        
        fs.writeFileSync(txtFilepath, txtContent, 'utf8');
        
        res.json({
            success: true,
            message: 'Presentación generada exitosamente',
            downloadUrl: `/downloads/${filename}`,
            txtDownloadUrl: `/downloads/${txtFilename}`,
            presentationData: presentationData
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al generar la presentación',
            details: error.message
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Middleware de seguridad para prevenir exposición de información sensible
app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
});

// Endpoint para obtener configuración del cliente (sin información sensible)
app.get('/api/config', (req, res) => {
    res.json({
        maxFileSize: '10MB',
        supportedFormats: ['pptx', 'txt'],
        version: '1.0.0'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`🌐 Producción: Servidor listo para recibir conexiones`);
    }
});