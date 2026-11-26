const os = require('os');
const path = require('path');
const fs = require('fs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-test-'));

process.env.DB_PATH = path.join(tmpDir, 'test.sqlite');
process.env.JWT_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres!!';
process.env.CACHE_TTL_SECONDS = '30';
process.env.RATE_LIMIT_MAX = '100000';
process.env.AUTH_RATE_LIMIT_MAX = '100000';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const db = require('../config/database');
const User = require('../models/User');
const app = require('../app');

let server, base;
const tokens = {};

async function call(method, url, token, body, rawBody) {
    const response = await fetch(base + url, {
        method,
        headers: {
            ...(body !== undefined || rawBody ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined)
    });

    let data = {};
    try { data = await response.json(); } catch { /* sem corpo */ }

    return { status: response.status, data, headers: response.headers };
}

const login = async (email) =>
    (await call('POST', '/api/auth/login', null, { email, password: 'SenhaForte123' })).data.token;

before(async () => {
    const hash = bcrypt.hashSync('SenhaForte123', 4);
    User.create('admin@t.com', hash, 'admin');
    User.create('trainer1@t.com', hash, 'trainer');
    User.create('trainer2@t.com', hash, 'trainer');

    server = app.listen(0);
    base = `http://localhost:${server.address().port}`;

    tokens.admin = await login('admin@t.com');
    tokens.t1 = await login('trainer1@t.com');
    tokens.t2 = await login('trainer2@t.com');

    for (const [key, name, email] of [['m1', 'Maria Silva', 'm1@t.com'], ['m2', 'João Souza', 'm2@t.com']]) {
        tokens[key] = (await call('POST', '/api/auth/register', null,
            { name, email, password: 'SenhaForte123' })).data.token;
    }
});

after(() => {
    server.close();
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
});


test('migrações registradas e /health responde com a instância', async () => {
    const versions = db.prepare('SELECT version FROM schema_migrations ORDER BY version').all();
    assert.deepEqual(versions.map(v => v.version), ['001', '002', '003']);

    const r = await call('GET', '/health');
    assert.equal(r.status, 200);
    assert.equal(r.data.status, 'ok');
    assert.ok(r.headers.get('x-instance-id'));
});

test('helmet aplica cabeçalhos de segurança e esconde x-powered-by', async () => {
    const r = await call('GET', '/api');
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(r.headers.get('content-security-policy'));
    assert.equal(r.headers.get('x-powered-by'), null);
});

test('erros: JSON inválido => 400 padronizado, rota inexistente => 404, sem stack trace', async () => {
    const bad = await call('POST', '/api/auth/login', null, undefined, '{ isso nao e json');
    assert.equal(bad.status, 400);
    assert.deepEqual(Object.keys(bad.data), ['error']);
    assert.ok(!JSON.stringify(bad.data).includes('Unexpected'));

    const nf = await call('GET', '/api/nao-existe');
    assert.equal(nf.status, 404);
    assert.ok(!JSON.stringify(nf.data).includes('at '));
});


test('login: credenciais erradas => 401 genérico; senha > 72 bytes rejeitada no cadastro', async () => {
    const wrong = await call('POST', '/api/auth/login', null, { email: 'admin@t.com', password: 'errada123' });
    const unknown = await call('POST', '/api/auth/login', null, { email: 'x@t.com', password: 'errada123' });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.data.error, unknown.data.error);

    const long = await call('POST', '/api/auth/register', null,
        { name: 'Fulano', email: 'long@t.com', password: 'a'.repeat(80) });
    assert.equal(long.status, 400);
});

test('JWT com algoritmo diferente de HS256 é recusado', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ sub: 1, role: 'admin' }, process.env.JWT_SECRET, { algorithm: 'HS512' });
    const r = await call('GET', '/api/workouts', forged);
    assert.equal(r.status, 401);
});


test('sanitização: remove tags HTML, faz trim e preserva a senha como digitada', async () => {
    const r = await call('POST', '/api/auth/register', null, {
        name: '  <script>alert(1)</script>Carlos Lima  ',
        email: 'carlos@t.com',
        password: ' Senha Com Espaços 1 '
    });
    assert.equal(r.status, 201);

    const row = db.prepare('SELECT name FROM members ORDER BY id DESC LIMIT 1').get();
    assert.equal(row.name, 'alert(1)Carlos Lima');

    const again = await call('POST', '/api/auth/login', null,
        { email: 'carlos@t.com', password: ' Senha Com Espaços 1 ' });
    assert.equal(again.status, 200);
});

test('sanitização: __proto__ no corpo é descartado', async () => {
    const r = await call('POST', '/api/auth/login', null, undefined,
        '{"email":"admin@t.com","password":"SenhaForte123","__proto__":{"role":"admin"}}');
    assert.equal(r.status, 200);
    assert.equal(({}).role, undefined);
});


let w1, w2;

test('POST /api/workouts: permissões e regras', async () => {
    const body = { memberId: 1, name: 'Treino A', description: 'Peito', exercises: 'Supino 4x10' };

    assert.equal((await call('POST', '/api/workouts', null, body)).status, 401);
    assert.equal((await call('POST', '/api/workouts', tokens.m1, body)).status, 403);
    assert.equal((await call('POST', '/api/workouts', tokens.t1, { name: 'Sem membro' })).status, 400);
    assert.equal((await call('POST', '/api/workouts', tokens.t1, { ...body, memberId: 999 })).status, 404);
    assert.equal((await call('POST', '/api/workouts', tokens.t1, { ...body, trainerId: 3 })).status, 403);

    const ok = await call('POST', '/api/workouts', tokens.t1, body);
    assert.equal(ok.status, 201);
    w1 = ok.data.workout;
    assert.equal(w1.trainer_id, 2);

    const adminCreate = await call('POST', '/api/workouts', tokens.admin, { member_id: 2, name: 'Treino B', trainer_id: 3 });
    assert.equal(adminCreate.status, 201);
    w2 = adminCreate.data.workout;
    assert.equal(w2.trainer_id, 3);
});

test('GET /api/workouts/:id: member só vê o próprio treino (BOLA/IDOR)', async () => {
    assert.equal((await call('GET', `/api/workouts/${w1.id}`, tokens.m1)).status, 200);
    assert.equal((await call('GET', `/api/workouts/${w1.id}`, tokens.m2)).status, 403);
    assert.equal((await call('GET', `/api/workouts/${w1.id}`, tokens.t2)).status, 200);
    assert.equal((await call('GET', '/api/workouts/9999', tokens.admin)).status, 404);
    assert.equal((await call('GET', '/api/workouts/abc', tokens.admin)).status, 400);
});

test('GET /api/workouts/mine devolve só os treinos do membro logado', async () => {
    const r = await call('GET', '/api/workouts/mine', tokens.m1);
    assert.equal(r.status, 200);
    assert.deepEqual(r.data.workouts.map(w => w.id), [w1.id]);
    assert.equal((await call('GET', '/api/workouts/mine', tokens.t1)).status, 403);
});

test('PUT /api/workouts/:id: só admin ou trainer responsável', async () => {
    assert.equal((await call('PUT', `/api/workouts/${w1.id}`, tokens.m1, { name: 'Novo nome' })).status, 403);
    assert.equal((await call('PUT', `/api/workouts/${w1.id}`, tokens.t2, { name: 'Novo nome' })).status, 403);
    assert.equal((await call('PUT', `/api/workouts/${w1.id}`, tokens.t1, {})).status, 400);

    const ok = await call('PUT', `/api/workouts/${w1.id}`, tokens.t1, { name: 'Treino A+' });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.workout.name, 'Treino A+');
    assert.equal(ok.data.workout.description, 'Peito');

    assert.equal((await call('PUT', `/api/workouts/${w1.id}`, tokens.t1, { trainerId: 3 })).status, 403);
    assert.equal((await call('PUT', `/api/workouts/${w1.id}`, tokens.admin, { trainerId: 3 })).status, 200);
});


test('cache: MISS -> HIT -> invalidado por POST, PUT e DELETE', async () => {
    const list = () => call('GET', '/api/workouts', tokens.t1);

    await call('POST', '/api/workouts', tokens.admin, { memberId: 1, name: 'Aquecimento' });
    assert.equal((await list()).headers.get('x-cache'), 'MISS');
    assert.equal((await list()).headers.get('x-cache'), 'HIT');

    const created = await call('POST', '/api/workouts', tokens.admin, { memberId: 1, name: 'Treino C' });
    const afterPost = await list();
    assert.equal(afterPost.headers.get('x-cache'), 'MISS');
    assert.ok(afterPost.data.workouts.some(w => w.name === 'Treino C'));
    assert.equal((await list()).headers.get('x-cache'), 'HIT');

    await call('PUT', `/api/workouts/${created.data.workout.id}`, tokens.admin, { name: 'Treino C2' });
    const afterPut = await list();
    assert.equal(afterPut.headers.get('x-cache'), 'MISS');
    assert.ok(afterPut.data.workouts.some(w => w.name === 'Treino C2'));

    await list();
    await call('DELETE', `/api/workouts/${created.data.workout.id}`, tokens.admin);
    const afterDelete = await list();
    assert.equal(afterDelete.headers.get('x-cache'), 'MISS');
    assert.ok(!afterDelete.data.workouts.some(w => w.name === 'Treino C2'));
});

test('GET /api/workouts: só admin e trainer', async () => {
    assert.equal((await call('GET', '/api/workouts', tokens.m1)).status, 403);
    assert.equal((await call('GET', '/api/workouts', tokens.admin)).status, 200);
});

test('DELETE /api/workouts/:id: somente admin', async () => {
    assert.equal((await call('DELETE', `/api/workouts/${w2.id}`, tokens.t1)).status, 403);
    assert.equal((await call('DELETE', `/api/workouts/${w2.id}`, tokens.m2)).status, 403);
    assert.equal((await call('DELETE', `/api/workouts/${w2.id}`, tokens.admin)).status, 200);
    assert.equal((await call('DELETE', `/api/workouts/${w2.id}`, tokens.admin)).status, 404);
});


test('GET /api/members/me e check-ins do próprio membro', async () => {
    const me = await call('GET', '/api/members/me', tokens.m1);
    assert.equal(me.status, 200);
    assert.equal(me.data.member.name, 'Maria Silva');

    assert.equal((await call('POST', '/api/checkins', tokens.m1)).status, 201);
    assert.equal((await call('POST', '/api/checkins', tokens.m1, { checkin_date: '31/12/2026' })).status, 400);
    assert.equal((await call('POST', '/api/checkins', tokens.t1)).status, 403);

    const own = await call('GET', `/api/checkins/${me.data.member.id}`, tokens.m1);
    assert.equal(own.status, 200);
    assert.equal(own.data.total, 1);

    const other = await call('GET', `/api/checkins/${me.data.member.id}`, tokens.m2);
    assert.equal(other.status, 403);
});

test('POST /api/members: só admin', async () => {
    const body = { name: 'Novo Aluno', email: 'novo@t.com', password: 'SenhaForte123' };
    assert.equal((await call('POST', '/api/members', tokens.t1, body)).status, 403);
    assert.equal((await call('POST', '/api/members', tokens.admin, body)).status, 201);
    assert.equal((await call('POST', '/api/members', tokens.admin, body)).status, 409);
});
