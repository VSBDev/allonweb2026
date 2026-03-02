/**
 * Lyrics Data for "Todo en Web"
 * Word-level timestamps from Whisper transcription
 * Corrected: "Te invibe, dices" → "2026"
 */

/**
 * Check if a line is a "Todo en web" chorus line
 */
export function isChorusLine(text) {
  const normalized = text.toLowerCase().trim();
  return normalized === 'todo en web, todo en web, todo en web' ||
         normalized === 'todo en web, todo en web';
}

/**
 * Line-based lyrics with word-level timing
 * Format: { text, start, end, words: [{word, start, end}] }
 */
export const lyricsData = [
  // Verse 1
  {
    text: "Otro icono en el escritorio, otra clave que olvidar",
    start: 3.84,
    end: 11.0,
    words: [
      { word: "Otro", start: 3.84, end: 5.02 },
      { word: "icono", start: 5.02, end: 5.62 },
      { word: "en", start: 5.62, end: 5.9 },
      { word: "el", start: 5.9, end: 6.4 },
      { word: "escritorio,", start: 6.4, end: 7.98 },
      { word: "otra", start: 8.5, end: 8.64 },
      { word: "clave", start: 8.64, end: 9.26 },
      { word: "que", start: 9.26, end: 9.62 },
      { word: "olvidar", start: 9.62, end: 11.0 }
    ]
  },
  {
    text: "Mil ventanas en el fondo, ¿quién las va a actualizar?",
    start: 11.6,
    end: 17.08,
    words: [
      { word: "Mil", start: 11.6, end: 12.02 },
      { word: "ventanas", start: 12.02, end: 12.94 },
      { word: "en", start: 12.94, end: 13.6 },
      { word: "el", start: 13.6, end: 14.02 },
      { word: "fondo,", start: 14.02, end: 14.7 },
      { word: "¿quién", start: 15.02, end: 15.3 },
      { word: "las", start: 15.3, end: 15.62 },
      { word: "va", start: 15.62, end: 16.02 },
      { word: "a", start: 16.02, end: 16.06 },
      { word: "actualizar?", start: 16.06, end: 17.08 }
    ]
  },
  {
    text: "Cansado de instalar historias, de esperar para empezar",
    start: 18.76,
    end: 25.18,
    words: [
      { word: "Cansado", start: 18.76, end: 19.46 },
      { word: "de", start: 19.46, end: 19.86 },
      { word: "instalar", start: 19.86, end: 20.64 },
      { word: "historias,", start: 20.64, end: 22.06 },
      { word: "de", start: 22.56, end: 22.78 },
      { word: "esperar", start: 22.78, end: 23.36 },
      { word: "para", start: 23.36, end: 23.92 },
      { word: "empezar", start: 23.92, end: 25.18 }
    ]
  },
  {
    text: "Abro el navegador y el mundo se echa a rodar",
    start: 26.04,
    end: 32.18,
    words: [
      { word: "Abro", start: 26.04, end: 26.84 },
      { word: "el", start: 26.84, end: 27.14 },
      { word: "navegador", start: 27.14, end: 28.58 },
      { word: "y", start: 28.58, end: 28.88 },
      { word: "el", start: 28.88, end: 29.2 },
      { word: "mundo", start: 29.2, end: 29.82 },
      { word: "se", start: 29.82, end: 30.4 },
      { word: "echa", start: 30.4, end: 30.64 },
      { word: "a", start: 30.64, end: 30.68 },
      { word: "rodar", start: 30.68, end: 32.18 }
    ]
  },
  {
    text: "Desde el sofá, desde el curro, solo un clic y ya estás dentro",
    start: 32.88,
    end: 40.02,
    words: [
      { word: "Desde", start: 32.88, end: 33.42 },
      { word: "el", start: 33.42, end: 33.6 },
      { word: "sofá,", start: 33.6, end: 34.44 },
      { word: "desde", start: 34.5, end: 35.08 },
      { word: "el", start: 35.08, end: 35.66 },
      { word: "curro,", start: 35.66, end: 36.52 },
      { word: "solo", start: 37.04, end: 37.2 },
      { word: "un", start: 37.2, end: 37.5 },
      { word: "clic", start: 37.5, end: 37.86 },
      { word: "y", start: 37.86, end: 38.18 },
      { word: "ya", start: 38.18, end: 38.56 },
      { word: "estás", start: 38.56, end: 38.9 },
      { word: "dentro", start: 38.9, end: 40.02 }
    ]
  },
  {
    text: "Lo que antes era un muro, cabe ahora en un momento",
    start: 40.02,
    end: 46.62,
    words: [
      { word: "Lo", start: 40.02, end: 40.8 },
      { word: "que", start: 40.8, end: 41.1 },
      { word: "antes", start: 41.1, end: 41.62 },
      { word: "era", start: 41.62, end: 42.28 },
      { word: "un", start: 42.28, end: 42.78 },
      { word: "muro,", start: 42.78, end: 43.88 },
      { word: "cabe", start: 44.3, end: 44.44 },
      { word: "ahora", start: 44.44, end: 45.0 },
      { word: "en", start: 45.0, end: 45.4 },
      { word: "un", start: 45.4, end: 45.86 },
      { word: "momento", start: 45.86, end: 46.62 }
    ]
  },
  // Chorus 1
  {
    text: "Todo en web, todo en web, todo en web",
    start: 46.62,
    end: 49.58,
    words: [
      { word: "Todo", start: 46.62, end: 47.1 },
      { word: "en", start: 47.1, end: 47.36 },
      { word: "web,", start: 47.36, end: 47.62 },
      { word: "todo", start: 47.68, end: 47.98 },
      { word: "en", start: 47.98, end: 48.2 },
      { word: "web,", start: 48.2, end: 48.56 },
      { word: "todo", start: 48.58, end: 48.86 },
      { word: "en", start: 48.86, end: 49.14 },
      { word: "web", start: 49.14, end: 49.58 }
    ]
  },
  {
    text: "Juegos, curro, vida entera en una pestaña",
    start: 49.58,
    end: 53.34,
    words: [
      { word: "Juegos,", start: 49.58, end: 50.56 },
      { word: "curro,", start: 50.98, end: 51.26 },
      { word: "vida", start: 51.48, end: 51.56 },
      { word: "entera", start: 51.56, end: 52.18 },
      { word: "en", start: 52.18, end: 52.48 },
      { word: "una", start: 52.48, end: 52.94 },
      { word: "pestaña", start: 52.94, end: 53.34 }
    ]
  },
  {
    text: "Todo en web, todo en web, todo en web",
    start: 53.34,
    end: 56.7,
    words: [
      { word: "Todo", start: 53.34, end: 54.26 },
      { word: "en", start: 54.26, end: 54.54 },
      { word: "web,", start: 54.54, end: 54.72 },
      { word: "todo", start: 54.84, end: 55.16 },
      { word: "en", start: 55.16, end: 55.4 },
      { word: "web,", start: 55.4, end: 55.74 },
      { word: "todo", start: 55.74, end: 56.06 },
      { word: "en", start: 56.06, end: 56.3 },
      { word: "web", start: 56.3, end: 56.7 }
    ]
  },
  {
    text: "Marketing, colegas, citas, casa y montaña",
    start: 56.7,
    end: 61.76,
    words: [
      { word: "Marketing,", start: 56.7, end: 57.58 },
      { word: "colegas,", start: 57.9, end: 58.66 },
      { word: "citas,", start: 59.0, end: 59.5 },
      { word: "casa", start: 59.92, end: 60.04 },
      { word: "y", start: 60.04, end: 60.26 },
      { word: "montaña", start: 60.26, end: 61.76 }
    ]
  },
  {
    text: "Ya da igual el cacharro que tengas",
    start: 61.76,
    end: 64.88,
    words: [
      { word: "Ya", start: 61.76, end: 62.18 },
      { word: "da", start: 62.18, end: 62.4 },
      { word: "igual", start: 62.4, end: 62.92 },
      { word: "el", start: 62.92, end: 63.18 },
      { word: "cacharro", start: 63.18, end: 63.78 },
      { word: "que", start: 63.78, end: 64.14 },
      { word: "tengas", start: 64.14, end: 64.88 }
    ]
  },
  {
    text: "Si te conectas, lo tienes todo en web",
    start: 64.88,
    end: 69.02,
    words: [
      { word: "Si", start: 64.88, end: 65.3 },
      { word: "te", start: 65.3, end: 65.88 },
      { word: "conectas,", start: 65.88, end: 66.62 },
      { word: "lo", start: 66.82, end: 67.0 },
      { word: "tienes", start: 67.0, end: 67.56 },
      { word: "todo", start: 67.56, end: 68.24 },
      { word: "en", start: 68.24, end: 68.6 },
      { word: "web", start: 68.6, end: 69.02 }
    ]
  },
  {
    text: "Todo en web, todo en web",
    start: 69.02,
    end: 70.98,
    words: [
      { word: "Todo", start: 69.02, end: 69.5 },
      { word: "en", start: 69.5, end: 69.72 },
      { word: "web,", start: 69.72, end: 70.0 },
      { word: "todo", start: 70.0, end: 70.4 },
      { word: "en", start: 70.4, end: 70.7 },
      { word: "web", start: 70.7, end: 70.98 }
    ]
  },
  // CORRECTED: "Te invibe, dices" → "2026"
  {
    text: "2026 en la pantalla",
    start: 70.98,
    end: 76.48,
    words: [
      { word: "2026", start: 70.98, end: 72.5 },
      { word: "en", start: 73.36, end: 74.0 },
      { word: "la", start: 74.0, end: 75.44 },
      { word: "pantalla", start: 75.44, end: 76.48 }
    ]
  },

  // Verse 2
  {
    text: "Antes mil apps en el móvil, cada una a pelear",
    start: 82.6,
    end: 89.5,
    words: [
      { word: "Antes", start: 82.6, end: 83.62 },
      { word: "mil", start: 83.62, end: 84.1 },
      { word: "apps", start: 84.1, end: 84.6 },
      { word: "en", start: 84.6, end: 85.26 },
      { word: "el", start: 85.26, end: 85.6 },
      { word: "móvil,", start: 85.6, end: 86.82 },
      { word: "cada", start: 87.34, end: 87.54 },
      { word: "una", start: 87.54, end: 88.14 },
      { word: "a", start: 88.14, end: 88.58 },
      { word: "pelear", start: 88.58, end: 89.5 }
    ]
  },
  {
    text: "Ahora entra y se despliega como magia en el cristal",
    start: 89.5,
    end: 96.8,
    words: [
      { word: "Ahora", start: 89.5, end: 91.04 },
      { word: "entra", start: 91.04, end: 91.72 },
      { word: "y", start: 91.72, end: 91.94 },
      { word: "se", start: 91.94, end: 92.46 },
      { word: "despliega", start: 92.46, end: 93.48 },
      { word: "como", start: 93.48, end: 94.42 },
      { word: "magia", start: 94.42, end: 95.16 },
      { word: "en", start: 95.16, end: 95.58 },
      { word: "el", start: 95.58, end: 95.9 },
      { word: "cristal", start: 95.9, end: 96.8 }
    ]
  },
  {
    text: "Firmo, envío, creo un logo, veo a mi gente al hablar",
    start: 96.8,
    end: 102.92,
    words: [
      { word: "Firmo,", start: 96.8, end: 97.4 },
      { word: "envío,", start: 97.4, end: 98.24 },
      { word: "creo", start: 98.54, end: 98.54 },
      { word: "un", start: 98.54, end: 98.82 },
      { word: "logo,", start: 98.82, end: 99.14 },
      { word: "veo", start: 99.16, end: 99.46 },
      { word: "a", start: 99.46, end: 99.68 },
      { word: "mi", start: 99.68, end: 99.82 },
      { word: "gente", start: 99.82, end: 100.34 },
      { word: "al", start: 100.34, end: 100.66 },
      { word: "hablar", start: 100.66, end: 102.92 }
    ]
  },
  {
    text: "Del salón salto a la oficina, solo al cambiar de lugar",
    start: 102.92,
    end: 110.62,
    words: [
      { word: "Del", start: 102.92, end: 103.8 },
      { word: "salón", start: 103.8, end: 104.56 },
      { word: "salto", start: 104.56, end: 105.1 },
      { word: "a", start: 105.1, end: 105.32 },
      { word: "la", start: 105.32, end: 105.68 },
      { word: "oficina,", start: 105.68, end: 107.62 },
      { word: "solo", start: 108.24, end: 108.42 },
      { word: "al", start: 108.42, end: 108.78 },
      { word: "cambiar", start: 108.78, end: 109.22 },
      { word: "de", start: 109.22, end: 109.62 },
      { word: "lugar", start: 109.62, end: 110.62 }
    ]
  },
  {
    text: "Lo personal y lo del trabajo se cruzan en el mismo lienzo",
    start: 110.62,
    end: 119.0,
    words: [
      { word: "Lo", start: 110.62, end: 112.14 },
      { word: "personal", start: 112.14, end: 113.02 },
      { word: "y", start: 113.02, end: 113.28 },
      { word: "lo", start: 113.28, end: 113.58 },
      { word: "del", start: 113.58, end: 113.98 },
      { word: "trabajo", start: 113.98, end: 114.88 },
      { word: "se", start: 114.88, end: 115.74 },
      { word: "cruzan", start: 115.74, end: 116.2 },
      { word: "en", start: 116.2, end: 116.78 },
      { word: "el", start: 116.78, end: 116.96 },
      { word: "mismo", start: 116.96, end: 117.7 },
      { word: "lienzo", start: 117.7, end: 119.0 }
    ]
  },
  {
    text: "Abro otra pestaña y viajo sin billete y sin esfuerzo",
    start: 119.0,
    end: 125.54,
    words: [
      { word: "Abro", start: 119.0, end: 119.66 },
      { word: "otra", start: 119.66, end: 120.0 },
      { word: "pestaña", start: 120.0, end: 121.06 },
      { word: "y", start: 121.06, end: 121.38 },
      { word: "viajo", start: 121.38, end: 122.48 },
      { word: "sin", start: 122.48, end: 123.12 },
      { word: "billete", start: 123.12, end: 123.72 },
      { word: "y", start: 123.72, end: 124.04 },
      { word: "sin", start: 124.04, end: 124.68 },
      { word: "esfuerzo", start: 124.68, end: 125.54 }
    ]
  },
  // Chorus 2
  {
    text: "Todo en web, todo en web, todo en web",
    start: 125.54,
    end: 128.36,
    words: [
      { word: "Todo", start: 125.54, end: 125.9 },
      { word: "en", start: 125.9, end: 126.18 },
      { word: "web,", start: 126.18, end: 126.44 },
      { word: "todo", start: 126.44, end: 126.78 },
      { word: "en", start: 126.78, end: 127.04 },
      { word: "web,", start: 127.04, end: 127.36 },
      { word: "todo", start: 127.36, end: 127.72 },
      { word: "en", start: 127.72, end: 128.0 },
      { word: "web", start: 128.0, end: 128.36 }
    ]
  },
  {
    text: "Juegos, curro, vida entera en una pestaña",
    start: 128.36,
    end: 132.68,
    words: [
      { word: "Juegos,", start: 128.36, end: 129.38 },
      { word: "curro,", start: 129.38, end: 130.08 },
      { word: "vida", start: 130.2, end: 130.36 },
      { word: "entera", start: 130.36, end: 131.0 },
      { word: "en", start: 131.0, end: 131.28 },
      { word: "una", start: 131.28, end: 131.72 },
      { word: "pestaña", start: 131.72, end: 132.68 }
    ]
  },
  {
    text: "Todo en web, todo en web, todo en web",
    start: 132.68,
    end: 135.52,
    words: [
      { word: "Todo", start: 132.68, end: 133.06 },
      { word: "en", start: 133.06, end: 133.3 },
      { word: "web,", start: 133.3, end: 133.56 },
      { word: "todo", start: 133.6, end: 133.94 },
      { word: "en", start: 133.94, end: 134.18 },
      { word: "web,", start: 134.18, end: 134.48 },
      { word: "todo", start: 134.48, end: 134.86 },
      { word: "en", start: 134.86, end: 135.14 },
      { word: "web", start: 135.14, end: 135.52 }
    ]
  },
  {
    text: "Marketing, colegas, citas, casa y montaña",
    start: 135.52,
    end: 140.7,
    words: [
      { word: "Marketing,", start: 135.52, end: 136.38 },
      { word: "colegas,", start: 136.72, end: 137.58 },
      { word: "citas,", start: 137.82, end: 138.32 },
      { word: "casa", start: 138.5, end: 138.86 },
      { word: "y", start: 138.86, end: 139.06 },
      { word: "montaña", start: 139.06, end: 140.7 }
    ]
  },
  {
    text: "Ya da igual el cacharro que tengas",
    start: 140.7,
    end: 143.68,
    words: [
      { word: "Ya", start: 140.7, end: 141.0 },
      { word: "da", start: 141.0, end: 141.22 },
      { word: "igual", start: 141.22, end: 141.7 },
      { word: "el", start: 141.7, end: 141.98 },
      { word: "cacharro", start: 141.98, end: 142.6 },
      { word: "que", start: 142.6, end: 142.98 },
      { word: "tengas", start: 142.98, end: 143.68 }
    ]
  },
  {
    text: "Si te conectas, lo tienes todo en web",
    start: 143.68,
    end: 147.88,
    words: [
      { word: "Si", start: 143.68, end: 144.12 },
      { word: "te", start: 144.12, end: 144.68 },
      { word: "conectas,", start: 144.68, end: 145.44 },
      { word: "lo", start: 145.64, end: 145.8 },
      { word: "tienes", start: 145.8, end: 146.34 },
      { word: "todo", start: 146.34, end: 146.98 },
      { word: "en", start: 146.98, end: 147.44 },
      { word: "web", start: 147.44, end: 147.88 }
    ]
  },
  {
    text: "Todo en web, todo en web",
    start: 147.88,
    end: 149.84,
    words: [
      { word: "Todo", start: 147.88, end: 148.32 },
      { word: "en", start: 148.32, end: 148.52 },
      { word: "web,", start: 148.52, end: 148.8 },
      { word: "todo", start: 148.88, end: 149.16 },
      { word: "en", start: 149.16, end: 149.46 },
      { word: "web", start: 149.46, end: 149.84 }
    ]
  },
  // CORRECTED: "Te invibe, dices" → "2026"
  {
    text: "2026 en la pantalla",
    start: 149.84,
    end: 155.28,
    words: [
      { word: "2026", start: 149.84, end: 151.14 },
      { word: "en", start: 151.92, end: 152.6 },
      { word: "la", start: 152.6, end: 154.26 },
      { word: "pantalla", start: 154.26, end: 155.28 }
    ]
  },

  // Verse 3
  {
    text: "Antes descargaba sueños para ver si iban a andar",
    start: 158.36,
    end: 164.44,
    words: [
      { word: "Antes", start: 158.36, end: 159.06 },
      { word: "descargaba", start: 159.06, end: 160.62 },
      { word: "sueños", start: 160.62, end: 161.58 },
      { word: "para", start: 161.58, end: 162.24 },
      { word: "ver", start: 162.24, end: 162.48 },
      { word: "si", start: 162.48, end: 162.72 },
      { word: "iban", start: 162.72, end: 163.08 },
      { word: "a", start: 163.08, end: 163.46 },
      { word: "andar", start: 163.46, end: 164.44 }
    ]
  },
  {
    text: "Ahora los lanzo directo y se ponen a girar",
    start: 164.44,
    end: 172.6,
    words: [
      { word: "Ahora", start: 164.44, end: 166.1 },
      { word: "los", start: 166.1, end: 166.78 },
      { word: "lanzo", start: 166.78, end: 167.74 },
      { word: "directo", start: 167.74, end: 168.52 },
      { word: "y", start: 168.52, end: 168.78 },
      { word: "se", start: 168.78, end: 169.1 },
      { word: "ponen", start: 169.1, end: 169.88 },
      { word: "a", start: 169.88, end: 170.26 },
      { word: "girar", start: 170.26, end: 172.6 }
    ]
  },
  {
    text: "Que se entere todo el mapa, que se entere hasta tu abuela",
    start: 172.6,
    end: 179.56,
    words: [
      { word: "Que", start: 172.6, end: 173.22 },
      { word: "se", start: 173.22, end: 173.5 },
      { word: "entere", start: 173.5, end: 174.12 },
      { word: "todo", start: 174.12, end: 174.78 },
      { word: "el", start: 174.78, end: 175.26 },
      { word: "mapa,", start: 175.26, end: 175.7 },
      { word: "que", start: 175.7, end: 176.74 },
      { word: "se", start: 176.74, end: 177.1 },
      { word: "entere", start: 177.1, end: 177.66 },
      { word: "hasta", start: 177.66, end: 178.2 },
      { word: "tu", start: 178.2, end: 178.58 },
      { word: "abuela", start: 178.58, end: 179.56 }
    ]
  },
  {
    text: "Si respira y tiene red, puede entrar en esta escena",
    start: 179.56,
    end: 187.92,
    words: [
      { word: "Si", start: 179.56, end: 180.4 },
      { word: "respira", start: 180.4, end: 181.14 },
      { word: "y", start: 181.14, end: 181.58 },
      { word: "tiene", start: 181.58, end: 182.2 },
      { word: "red,", start: 182.2, end: 182.86 },
      { word: "puede", start: 183.6, end: 183.98 },
      { word: "entrar", start: 183.98, end: 184.58 },
      { word: "en", start: 184.58, end: 185.32 },
      { word: "esta", start: 185.32, end: 185.62 },
      { word: "escena", start: 185.62, end: 187.92 }
    ]
  },
  // Final Chorus
  {
    text: "Todo en web, todo en web, todo en web",
    start: 187.92,
    end: 191.02,
    words: [
      { word: "Todo", start: 187.92, end: 188.52 },
      { word: "en", start: 188.52, end: 188.8 },
      { word: "web,", start: 188.8, end: 189.04 },
      { word: "todo", start: 189.12, end: 189.46 },
      { word: "en", start: 189.46, end: 189.74 },
      { word: "web,", start: 189.74, end: 189.98 },
      { word: "todo", start: 190.0, end: 190.38 },
      { word: "en", start: 190.38, end: 190.62 },
      { word: "web", start: 190.62, end: 191.02 }
    ]
  },
  {
    text: "Juegos, curro, vida entera en una pestaña",
    start: 191.02,
    end: 195.34,
    words: [
      { word: "Juegos,", start: 191.02, end: 192.06 },
      { word: "curro,", start: 192.06, end: 192.76 },
      { word: "vida", start: 192.9, end: 193.04 },
      { word: "entera", start: 193.04, end: 193.68 },
      { word: "en", start: 193.68, end: 193.96 },
      { word: "una", start: 193.96, end: 194.42 },
      { word: "pestaña", start: 194.42, end: 195.34 }
    ]
  },
  {
    text: "Todo en web, todo en web, todo en web",
    start: 195.34,
    end: 198.22,
    words: [
      { word: "Todo", start: 195.34, end: 195.72 },
      { word: "en", start: 195.72, end: 196.0 },
      { word: "web,", start: 196.0, end: 196.26 },
      { word: "todo", start: 196.44, end: 196.66 },
      { word: "en", start: 196.66, end: 196.9 },
      { word: "web,", start: 196.9, end: 197.18 },
      { word: "todo", start: 197.18, end: 197.56 },
      { word: "en", start: 197.56, end: 197.8 },
      { word: "web", start: 197.8, end: 198.22 }
    ]
  },
  {
    text: "Marketing, colegas, citas, casa y montaña",
    start: 198.22,
    end: 203.34,
    words: [
      { word: "Marketing,", start: 198.22, end: 199.04 },
      { word: "colegas,", start: 199.28, end: 200.16 },
      { word: "citas,", start: 200.5, end: 201.0 },
      { word: "casa", start: 201.4, end: 201.54 },
      { word: "y", start: 201.54, end: 201.78 },
      { word: "montaña", start: 201.78, end: 203.34 }
    ]
  },
  {
    text: "Ya da igual el cacharro que tengas",
    start: 203.34,
    end: 206.36,
    words: [
      { word: "Ya", start: 203.34, end: 203.74 },
      { word: "da", start: 203.74, end: 203.9 },
      { word: "igual", start: 203.9, end: 204.38 },
      { word: "el", start: 204.38, end: 204.68 },
      { word: "cacharro", start: 204.68, end: 205.26 },
      { word: "que", start: 205.26, end: 205.62 },
      { word: "tengas", start: 205.62, end: 206.36 }
    ]
  },
  {
    text: "Si te conectas, lo tienes todo en web",
    start: 206.36,
    end: 210.52,
    words: [
      { word: "Si", start: 206.36, end: 206.8 },
      { word: "te", start: 206.8, end: 207.3 },
      { word: "conectas,", start: 207.3, end: 208.1 },
      { word: "lo", start: 208.32, end: 208.5 },
      { word: "tienes", start: 208.5, end: 209.04 },
      { word: "todo", start: 209.04, end: 209.96 },
      { word: "en", start: 209.96, end: 210.22 },
      { word: "web", start: 210.22, end: 210.52 }
    ]
  },
  {
    text: "Todo en web, todo en web",
    start: 210.52,
    end: 212.58,
    words: [
      { word: "Todo", start: 210.52, end: 211.0 },
      { word: "en", start: 211.0, end: 211.22 },
      { word: "web,", start: 211.22, end: 211.46 },
      { word: "todo", start: 211.56, end: 211.86 },
      { word: "en", start: 211.86, end: 212.12 },
      { word: "web", start: 212.12, end: 212.58 }
    ]
  },
  // CORRECTED: "Te invibe, dices" → "2026"
  {
    text: "2026 en la pantalla",
    start: 212.58,
    end: 218.02,
    words: [
      { word: "2026", start: 212.58, end: 213.98 },
      { word: "en", start: 214.74, end: 215.2 },
      { word: "la", start: 215.2, end: 216.84 },
      { word: "pantalla", start: 216.84, end: 218.02 }
    ]
  },
  // Outro
  {
    text: "Todo en web, todo en web",
    start: 218.02,
    end: 219.72,
    words: [
      { word: "Todo", start: 218.02, end: 218.46 },
      { word: "en", start: 218.46, end: 219.08 },
      { word: "web,", start: 219.08, end: 219.08 },
      { word: "todo", start: 219.08, end: 219.58 },
      { word: "en", start: 219.58, end: 219.58 },
      { word: "web", start: 219.58, end: 219.72 }
    ]
  },
  {
    text: "Que sueñas",
    start: 219.72,
    end: 221.36,
    words: [
      { word: "Que", start: 219.72, end: 220.04 },
      { word: "sueñas", start: 220.04, end: 221.36 }
    ]
  },
  {
    text: "Todo en web, todo en web",
    start: 221.36,
    end: 223.22,
    words: [
      { word: "Todo", start: 221.36, end: 221.84 },
      { word: "en", start: 221.84, end: 222.1 },
      { word: "web,", start: 222.1, end: 222.1 },
      { word: "todo", start: 222.48, end: 223.02 },
      { word: "en", start: 223.02, end: 223.22 },
      { word: "web", start: 223.22, end: 223.22 }
    ]
  },
  {
    text: "Y empieza la entrega",
    start: 223.22,
    end: 225.02,
    words: [
      { word: "Y", start: 223.22, end: 223.58 },
      { word: "empieza", start: 223.58, end: 224.06 },
      { word: "la", start: 224.06, end: 224.48 },
      { word: "entrega", start: 224.48, end: 225.02 }
    ]
  },
  {
    text: "Todo en web, todo en web",
    start: 225.02,
    end: 227.6,
    words: [
      { word: "Todo", start: 225.02, end: 225.58 },
      { word: "en", start: 225.58, end: 225.66 },
      { word: "web,", start: 225.66, end: 226.26 },
      { word: "todo", start: 226.26, end: 226.66 },
      { word: "en", start: 226.66, end: 226.68 },
      { word: "web", start: 226.68, end: 227.6 }
    ]
  }
];

/**
 * Get song duration (approximate)
 */
export const songDuration = 227.6;
