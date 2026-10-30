# EstudIA 📚

Asistente de estudio para la **Secundaria Básica cubana** (7mo, 8vo y 9no grado).
Responde usando **exclusivamente** el contenido de los 35 libros de texto, y cita la página de donde sale cada idea.

> Web: https://developer120511.github.io/website/estudia/
> API: https://estudia-api.estudia-cuba.workers.dev

---

## Qué hace

- **Login propio** con correo y contraseña. Cada cuenta tiene su historial, guardado en la nube.
- **Selector de grado y materia**: 7mo/8vo/9no · Biología, Español-Literatura, Física, Geografía, Historia, Informática, Inglés, Matemática, Química, Educación Laboral, Educación Moral y Ciudadana.
- **Respuestas citadas**: chips con la materia y la página exacta del libro.
- **Tres modos**: ⚡ Rápido, ⚖️ Equilibrado, 🎯 Preciso (cambia el modelo según lo que necesites).
- **Streaming**: el texto aparece mientras se genera.
- **Caché**: si alguien ya preguntó lo mismo en la misma materia, responde al instante sin gastar cuota.
- **Cuota diaria**: 40 preguntas por usuario.

## Arquitectura

```
Navegador  →  GitHub Pages (esta web)
     ↓
Cloudflare Worker  (estudia-api)
     ├─ D1 (SQLite + FTS5): 35 libros, 21.238 fragmentos, historial, caché
     └─ Workers AI: Llama 3.1 8B · Mistral Small 24B · gpt-oss-120b
```

Todo gratis, todo en la nube. **No hay servidor propio ni PC encendido.**

### Cómo funciona la búsqueda

1. La pregunta se normaliza (minúsculas, sin acentos) y se le quitan las palabras vacías.
2. Se consulta el índice **FTS5** con los términos en `AND` (precisión) y, si hay pocos resultados, en `OR` (recall), filtrando por grado y materia.
3. Se toman los 6 mejores fragmentos por ranking **BM25**, se cortan a ~1.400 caracteres y se arman como contexto.
4. El modelo responde solo con ese contexto y con la instrucción de citar.

## Código fuente

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la web (HTML + CSS + JS en un solo archivo, sin dependencias externas) |
| `worker/src/index.js` | Backend: auth, búsqueda RAG, streaming SSE, caché, cuotas |
| `worker/wrangler.toml` | Configuración del despliegue (binding D1 + AI) |

### Desplegar cambios en el backend

```bash
cd worker
CLOUDFLARE_API_TOKEN=tu_token npx wrangler deploy
```

## Seguridad

- La contraseña **nunca sale del navegador**: se deriva con **PBKDF2-SHA256, 200.000 iteraciones**, y solo se envía el verificador.
- El servidor guarda `SHA-256(verificador)`, así que una fuga de la base de datos no da contraseñas utilizables.
- Sesiones con token aleatorio de 256 bits y caducidad de 30 días.
- Código de recuperación de 16 caracteres generado al registrarse (se muestra una sola vez).
- Cada consulta de historial filtra por `user_id`.

## Límites gratuitos (Cloudflare)

| Recurso | Límite | Consumo típico |
|---|---|---|
| Workers | 100.000 pet./día | ~30 por conversación |
| D1 | 5 GB, 100k escrituras/día | 21.238 filas cargadas |
| Workers AI | 10.000 neuronas/día | ~250 respuestas (rápido) · ~90 (equilibrado) · ~83 (preciso) |

## Añadir un libro nuevo

1. Convierte el PDF a texto: `pdftotext -layout libro.pdf libro.txt`
2. Trocea por páginas (el separador es `\f`) en fragmentos de ~900 caracteres.
3. Inserta en `chunks` y en `chunks_fts` con el mismo `id`.

---

Hecho con Cloudflare Workers + D1 + Workers AI · 2.271.184 palabras de libros de texto indexadas.
