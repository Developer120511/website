/**
 * EstudIA — backend RAG sobre libros de secundaria (Cuba)
 * Cloudflare Worker + D1 (FTS5) + Workers AI
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Max-Age': '86400',
};

const MODEL_FAST = '@cf/meta/llama-3.1-8b-instruct-fp8';
const MODEL_MID = '@cf/mistralai/mistral-small-3.1-24b-instruct';
const MODEL_BEST = '@cf/openai/gpt-oss-120b';
const MODELS = { rapido: MODEL_FAST, equilibrado: MODEL_MID, preciso: MODEL_BEST };

const DAILY_LIMIT = 40; // preguntas por usuario y dia

const STOP = new Set(('de la que el en los las un una unos unas y o u a al del lo su sus por para con sin ' +
  'es son fue ser esta este estas estos como cuando donde se le les mas muy pero si no ni tambien ' +
  'cual cuales cuanto cuanta cuantos cuantas porque que quien quienes hay ha han he has ' +
  'me te nos os mi tu mis tus nuestro nuestra yo tu el ella ellos ellas usted ustedes ' +
  'explica explica explicame define defineme dice dicen significa sobre segun durante entre ' +
  'todo toda todos todas otro otra otros otras mismo misma puede pueden hacer hace hacen').split(/\s+/));

/* ---------- utilidades ---------- */

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });

const err = (msg, status = 400) => json({ error: msg }, status);

function randHex(n = 32) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function safeEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function normalize(t) {
  return (t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function terms(q) {
  const seen = new Set();
  const out = [];
  for (const w of normalize(q).split(' ')) {
    if (w.length < 3 || STOP.has(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out.slice(0, 12);
}

/* ---------- auth ---------- */

async function auth(req, env) {
  const h = req.headers.get('Authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, s.expires_at FROM sessions s
     JOIN users u ON u.id = s.user_id WHERE s.token = ?`
  ).bind(token).first();
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  return row;
}

async function usageLeft(env, userId) {
  const day = new Date().toISOString().slice(0, 10);
  const r = await env.DB.prepare('SELECT count FROM usage WHERE user_id=? AND day=?')
    .bind(userId, day).first();
  const used = r ? r.count : 0;
  return { used, left: Math.max(0, DAILY_LIMIT - used) };
}

async function bumpUsage(env, userId) {
  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(
    `INSERT INTO usage (user_id, day, count) VALUES (?,?,1)
     ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1`
  ).bind(userId, day).run();
}

/* ---------- recuperacion ---------- */

async function retrieve(env, question, grade, subject, limit = 6) {
  const ts = terms(question);
  if (!ts.length) return [];
  const build = (op) => ts.map((t) => `"${t}"`).join(` ${op} `);
  const filters = [];
  const params = [];
  if (grade && grade !== 'todos') { filters.push('b.grade = ?'); params.push(grade); }
  if (subject && subject !== 'todas') { filters.push('b.subject = ?'); params.push(subject); }
  const where = filters.length ? ' AND ' + filters.join(' AND ') : '';

  const run = async (op) => {
    const sql = `SELECT c.id, c.page, b.title, b.subject, b.grade,
                        snippet(chunks_fts, 0, '', '', '…', 24) AS frag, rank
                 FROM chunks_fts f
                 JOIN chunks c ON c.id = f.rowid
                 JOIN books b ON b.id = c.book_id
                 WHERE chunks_fts MATCH ?${where}
                 ORDER BY rank LIMIT ?`;
    const res = await env.DB.prepare(sql).bind(build(op), ...params, limit).all();
    return res.results || [];
  };

  let rows = await run('AND');
  if (rows.length < 3) {
    const or = await run('OR');
    const seen = new Set(rows.map((r) => r.id));
    for (const r of or) if (!seen.has(r.id)) { rows.push(r); seen.add(r.id); }
  }
  // texto completo de los fragmentos elegidos
  const ids = rows.slice(0, limit).map((r) => r.id);
  if (!ids.length) return [];
  const ph = ids.map(() => '?').join(',');
  const full = await env.DB.prepare(
    `SELECT c.id, c.page, c.text, b.title, b.subject, b.grade
     FROM chunks c JOIN books b ON b.id = c.book_id WHERE c.id IN (${ph})`
  ).bind(...ids).all();
  const byId = new Map((full.results || []).map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean).map((r) => ({
    page: r.page, title: r.title, subject: r.subject, grade: r.grade,
    text: (r.text || '').slice(0, 1400),
  }));
}

function buildPrompt(question, frags, grade, subject) {
  const ctx = frags.map((f, i) =>
    `[${i + 1}] ${f.subject} · ${f.grade} · pág. ${f.page}\n${f.text}`).join('\n\n');
  const scope = [
    grade && grade !== 'todos' ? `grado ${grade}` : null,
    subject && subject !== 'todas' ? `asignatura ${subject}` : null,
  ].filter(Boolean).join(', ');
  return [
    {
      role: 'system',
      content:
`Eres EstudIA, un profesor cubano de Secundaria Básica. Ayudas a estudiantes a estudiar.

REGLAS ESTRICTAS:
- Responde SIEMPRE en español, con lenguaje claro y adaptado a un estudiante de secundaria.
- Usa ÚNICAMENTE la información de los FRAGMENTOS. No inventes datos, fórmulas ni fechas.
- Si los fragmentos no contienen la respuesta, dilo honestamente: "Ese contenido no aparece en los libros disponibles" y sugiere reformular la pregunta.
- Cita la fuente con el número entre corchetes al final de cada idea, por ejemplo [1] o [2].
- Estructura la respuesta: idea principal, desarrollo con viñetas si ayuda, y un ejemplo si el fragmento lo trae.
- Usa Markdown sencillo (**negrita**, listas con -, y $...$ para fórmulas). No uses tablas.
${scope ? `- El estudiante está consultando: ${scope}.` : ''}`
    },
    { role: 'user', content: `FRAGMENTOS:\n\n${ctx}\n\nPREGUNTA DEL ESTUDIANTE: ${question}` },
  ];
}

/* ---------- rutas ---------- */

async function register(req, env) {
  const b = await req.json().catch(() => null);
  if (!b || !b.email || !b.verifier || !b.salt) return err('Datos incompletos');
  const email = String(b.email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('Correo no válido');
  if (String(b.verifier).length < 20) return err('Contraseña no válida');

  const exists = await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first();
  if (exists) return err('Ese correo ya está registrado', 409);

  const vhash = await sha256(String(b.verifier));
  const recovery = b.recovery ? await sha256(String(b.recovery)) : null;
  const r = await env.DB.prepare(
    'INSERT INTO users (email, name, salt, verifier, recovery) VALUES (?,?,?,?,?)'
  ).bind(email, (b.name || '').slice(0, 60), String(b.salt), vhash, recovery).run();
  const id = r.meta.last_row_id;

  const token = randHex(32);
  const exp = new Date(Date.now() + 30 * 864e5).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)')
    .bind(token, id, exp).run();
  return json({ token, user: { id, email, name: b.name || '' } });
}

async function login(req, env) {
  const b = await req.json().catch(() => null);
  if (!b || !b.email || !b.verifier) return err('Datos incompletos');
  const email = String(b.email).trim().toLowerCase();
  const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
  if (!u) return err('Correo o contraseña incorrectos', 401);
  const vhash = await sha256(String(b.verifier));
  if (!safeEq(vhash, u.verifier)) return err('Correo o contraseña incorrectos', 401);
  const token = randHex(32);
  const exp = new Date(Date.now() + 30 * 864e5).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)')
    .bind(token, u.id, exp).run();
  return json({ token, user: { id: u.id, email: u.email, name: u.name } });
}

async function recover(req, env) {
  const b = await req.json().catch(() => null);
  if (!b || !b.email || !b.recovery || !b.verifier) return err('Datos incompletos');
  const email = String(b.email).trim().toLowerCase();
  const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
  if (!u || !u.recovery) return err('No se puede recuperar esta cuenta', 400);
  const rh = await sha256(String(b.recovery));
  if (!safeEq(rh, u.recovery)) return err('Código de recuperación incorrecto', 401);
  const vhash = await sha256(String(b.verifier));
  await env.DB.prepare('UPDATE users SET verifier=?, salt=? WHERE id=?')
    .bind(vhash, String(b.salt || ''), u.id).run();
  return json({ ok: true });
}

async function catalog(env) {
  const r = await env.DB.prepare(
    `SELECT grade, subject, title, pages, words FROM books ORDER BY grade, subject`
  ).all();
  const rows = r.results || [];
  const grades = [...new Set(rows.map((x) => x.grade))].sort();
  const subjects = [...new Set(rows.map((x) => x.subject))].sort();
  return json({ books: rows, grades, subjects, chunks: rows.length });
}

async function chat(req, env, user) {
  const b = await req.json().catch(() => null);
  if (!b || !b.q) return err('Falta la pregunta');
  const q = String(b.q).slice(0, 1200).trim();
  const grade = b.grade || 'todos';
  const subject = b.subject || 'todas';
  const mode = ['rapido', 'equilibrado', 'preciso'].includes(b.mode) ? b.mode : 'equilibrado';
  const convId = b.conv_id ? Number(b.conv_id) : null;

  const { left } = await usageLeft(env, user.id);
  if (left <= 0) {
    return json({ error: 'Límite diario alcanzado', detail: `Has usado tus ${DAILY_LIMIT} preguntas de hoy. Vuelve mañana.` }, 429);
  }

  // conversacion
  let conv = convId;
  if (conv) {
    const own = await env.DB.prepare('SELECT id FROM conversations WHERE id=? AND user_id=?')
      .bind(conv, user.id).first();
    if (!own) conv = null;
  }
  if (!conv) {
    const r = await env.DB.prepare(
      'INSERT INTO conversations (user_id,title,grade,subject) VALUES (?,?,?,?)'
    ).bind(user.id, q.slice(0, 70), grade, subject).run();
    conv = r.meta.last_row_id;
  } else {
    await env.DB.prepare("UPDATE conversations SET updated_at=datetime('now') WHERE id=?").bind(conv).run();
  }

  await env.DB.prepare('INSERT INTO messages (conv_id,role,content) VALUES (?,?,?)')
    .bind(conv, 'user', q).run();

  const ckey = await sha256(normalize(q) + '|' + grade + '|' + subject + '|' + mode);
  const cached = await env.DB.prepare('SELECT answer,sources FROM cache WHERE key=?').bind(ckey).first();

  const encoder = new TextEncoder();
  const mkStream = (producer) => new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try { await producer(send); } catch (e) { send({ e: String(e).slice(0, 300) }); }
      controller.close();
    },
  });

  const finish = async (send, convIdLocal, answer, sources) => {
    await env.DB.prepare('INSERT INTO messages (conv_id,role,content,sources) VALUES (?,?,?,?)')
      .bind(convIdLocal, 'assistant', answer, JSON.stringify(sources)).run();
    await bumpUsage(env, user.id);
    send({ done: true, conv_id: convIdLocal, sources });
  };

  if (cached) {
    const sources = JSON.parse(cached.sources || '[]');
    const stream = mkStream(async (send) => {
      send({ conv_id: conv, cached: true });
      for (let i = 0; i < cached.answer.length; i += 60) {
        send({ t: cached.answer.slice(i, i + 60) });
      }
      await finish(send, conv, cached.answer, sources);
    });
    return new Response(stream, { headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  const frags = await retrieve(env, q, grade, subject, 6);
  const sources = frags.map((f) => ({ title: f.title, subject: f.subject, grade: f.grade, page: f.page }));

  if (!frags.length) {
    const msg = 'No encontré contenido sobre eso en los libros de esa materia. Prueba a elegir otra materia o a escribir la pregunta con otras palabras.';
    const stream = mkStream(async (send) => {
      send({ conv_id: conv }); send({ t: msg });
      await finish(send, conv, msg, []);
    });
    return new Response(stream, { headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  const messages = buildPrompt(q, frags, grade, subject);
  const model = MODELS[mode] || MODEL_MID;

  const stream = mkStream(async (send) => {
    send({ conv_id: conv, model, sources });
    let answer = '';
    let ai;
    try {
      ai = await env.AI.run(model, { messages, stream: true, max_tokens: 1100, temperature: 0.25 });
    } catch (e) {
      try {
        const alt = model === MODEL_FAST ? MODEL_MID : MODEL_FAST;
        ai = await env.AI.run(alt, { messages, stream: true, max_tokens: 1100, temperature: 0.25 });
      } catch (e2) {
        send({ e: 'El modelo no está disponible ahora mismo. Inténtalo en un minuto.' });
        return;
      }
    }
    const reader = ai.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith('data:')) continue;
        const payload = s.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const j = JSON.parse(payload);
          const d = j.choices?.[0]?.delta || {};
          const piece = j.response || d.content || '';
          if (piece) { answer += piece; send({ t: piece }); }
        } catch { /* ignorar */ }
      }
    }
    answer = answer.trim();
    if (!answer) answer = 'No pude generar una respuesta. Intenta reformular la pregunta.';
    await env.DB.prepare('INSERT OR REPLACE INTO cache (key,answer,sources,grade,subject) VALUES (?,?,?,?,?)')
      .bind(ckey, answer, JSON.stringify(sources), grade, subject).run();
    await finish(send, conv, answer, sources);
  });

  return new Response(stream, { headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
}

/* ---------- main ---------- */

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, '') || '/';

    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    try {
      if (p === '/' || p === '/api/health')
        return json({ ok: true, service: 'estudia', version: 1 });

      if (p === '/api/catalog') return catalog(env);
      if (p === '/api/register' && req.method === 'POST') return register(req, env);
      if (p === '/api/login' && req.method === 'POST') return login(req, env);
      if (p === '/api/recover' && req.method === 'POST') return recover(req, env);

      const user = await auth(req, env);
      if (!user) return err('No autenticado', 401);

      if (p === '/api/me') {
        const u = await usageLeft(env, user.id);
        return json({ user, usage: { used: u.used, left: u.left, limit: DAILY_LIMIT } });
      }

      if (p === '/api/conversations' && req.method === 'GET') {
        const r = await env.DB.prepare(
          'SELECT id,title,grade,subject,updated_at FROM conversations WHERE user_id=? ORDER BY updated_at DESC LIMIT 60'
        ).bind(user.id).all();
        return json({ conversations: r.results || [] });
      }

      if (p === '/api/conversations' && req.method === 'POST') {
        const r = await env.DB.prepare(
          'INSERT INTO conversations (user_id,title,grade,subject) VALUES (?,?,?,?)'
        ).bind(user.id, 'Nueva conversación', 'todos', 'todas').run();
        return json({ id: r.meta.last_row_id });
      }

      let m = p.match(/^\/api\/conversations\/(\d+)$/);
      if (m && req.method === 'GET') {
        const own = await env.DB.prepare('SELECT id FROM conversations WHERE id=? AND user_id=?')
          .bind(Number(m[1]), user.id).first();
        if (!own) return err('No encontrada', 404);
        const r = await env.DB.prepare(
          'SELECT role,content,sources,created_at FROM messages WHERE conv_id=? ORDER BY id'
        ).bind(Number(m[1])).all();
        return json({ messages: r.results || [] });
      }

      if (m && req.method === 'DELETE') {
        await env.DB.prepare('DELETE FROM messages WHERE conv_id=? AND conv_id IN (SELECT id FROM conversations WHERE id=? AND user_id=?)')
          .bind(Number(m[1]), Number(m[1]), user.id).run();
        await env.DB.prepare('DELETE FROM conversations WHERE id=? AND user_id=?')
          .bind(Number(m[1]), user.id).run();
        return json({ ok: true });
      }

      if (p === '/api/chat' && req.method === 'POST') return chat(req, env, user);

      return err('Ruta no encontrada', 404);
    } catch (e) {
      return err('Error interno: ' + String(e).slice(0, 200), 500);
    }
  },
};
