(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const state = { token: null, user: null, member: null, view: null, seen: new Set() };

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === false || value == null) continue;
      if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      el.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  const field = (label, control) => h('label', { class: 'field' }, h('span', {}, label), control);

  function fmtDate(value) {
    if (!value) return '-';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split('-').reverse().join('/');
    const date = new Date(value.replace(' ', 'T') + 'Z');
    return isNaN(date) ? value : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  let toastTimer;
  function toast(message, isError) {
    const box = $('#toast');
    box.textContent = message;
    box.className = 'toast' + (isError ? ' error' : '');
    box.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.hidden = true; }, 4000);
  }


  function updateStatus(method, path, res) {
    const instance = res.headers.get('X-Instance-Id');
    if (instance) {
      state.seen.add(instance);
      $('#st-instance').textContent = instance;
      $('#st-seen').textContent = [...state.seen].sort().join(', ');
    }
    const cache = res.headers.get('X-Cache');
    if (cache) $('#st-cache').textContent = cache === 'HIT' ? 'HIT (veio do cache)' : 'MISS (veio do banco)';
    $('#st-last').textContent = `${method} ${path} → ${res.status}`;
  }

  async function api(method, path, body) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (state.token) headers.Authorization = 'Bearer ' + state.token;

    const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    updateStatus(method, path, res);

    let data = {};
    try { data = await res.json(); } catch { /* resposta sem corpo */ }

    if (res.status === 401 && state.token) {
      logout('Sua sessão expirou. Entre novamente.');
      throw new Error('Sessão expirada');
    }

    if (!res.ok) {
      const details = (data.details || []).map((d) => `${d.field}: ${d.message}`).join('; ');
      const error = new Error(details ? `${data.error}. ${details}` : (data.error || 'Erro inesperado'));
      error.status = res.status;
      throw error;
    }
    return data;
  }


  function saveSession() {
    sessionStorage.setItem('gym_session', JSON.stringify({ token: state.token, user: state.user }));
  }

  async function startSession(result) {
    state.token = result.token;
    state.user = result.user;
    state.member = null;
    saveSession();
    await showApp();
  }

  function logout(message) {
    state.token = state.user = state.member = null;
    sessionStorage.removeItem('gym_session');
    $('#app').hidden = true;
    $('#auth-screen').hidden = false;
    $('#dialog').open && $('#dialog').close();
    if (message) toast(message, true);
  }

  const isStaff = () => state.user.role === 'admin' || state.user.role === 'trainer';
  const roleLabel = { admin: 'Administrador', trainer: 'Treinador', member: 'Aluno' };

  async function showApp() {
    $('#auth-screen').hidden = true;
    $('#app').hidden = false;
    $('#who-email').textContent = state.user.email;
    const tape = $('#who-role');
    tape.textContent = roleLabel[state.user.role];
    tape.className = 'tape ' + state.user.role;

    if (!isStaff()) {
      try { state.member = (await api('GET', '/api/members/me')).member; }
      catch (error) { toast(error.message, true); }
    }

    const items = isStaff()
      ? [['workouts', 'Treinos'], ['members', 'Membros'], ['checkins', 'Check-ins']]
      : [['workouts', 'Meus treinos'], ['checkins', 'Meus check-ins']];

    $('#nav').replaceChildren(...items.map(([id, label]) =>
      h('button', { type: 'button', 'data-view': id, onclick: () => navigate(id) }, label)));
    navigate('workouts');
  }


  const views = { workouts: viewWorkouts, members: viewMembers, checkins: viewCheckins };

  async function navigate(view) {
    state.view = view;
    document.querySelectorAll('#nav button').forEach((b) => {
      if (b.dataset.view === view) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    try { await views[view](); } catch (error) { if (error.message !== 'Sessão expirada') toast(error.message, true); }
    $('#content').focus({ preventScroll: true });
  }

  function pageHead(title, subtitle, action) {
    return h('div', { class: 'page-head' }, h('div', {}, h('h2', {}, title), subtitle && h('p', {}, subtitle)), action);
  }

  function emptyState(title, text) {
    return h('div', { class: 'panel' }, h('div', { class: 'empty' }, h('strong', {}, title), text));
  }

  function table(headers, rows) {
    return h('div', { class: 'panel' }, h('table', {},
      h('thead', {}, h('tr', {}, headers.map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, rows.map((cells) => h('tr', {}, cells.map((c) =>
        h('td', {}, c && c.nodes ? h('div', { class: 'actions' }, c.nodes) : c)))))));
  }


  function openDialog(title, ...body) {
    const dialog = $('#dialog');
    dialog.replaceChildren(
      h('div', { class: 'dialog-head' }, h('h2', {}, title),
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Fechar', onclick: () => dialog.close() }, '×')),
      h('div', { class: 'dialog-body' }, body));
    dialog.showModal();
    return dialog;
  }


  const canEdit = (w) => state.user.role === 'admin' || w.trainer_id === state.user.id;

  async function viewWorkouts() {
    const box = $('#content');

    if (!isStaff()) {
      const { workouts } = await api('GET', '/api/workouts/mine');
      box.replaceChildren(
        pageHead('Meus treinos', 'Os treinos que seu treinador montou para você.'),
        workouts.length
          ? h('div', { class: 'cards' }, workouts.map((w) => h('article', { class: 'card' },
              h('h3', {}, w.name),
              h('p', { class: 'muted' }, w.description || 'Sem descrição'),
              h('p', { class: 'muted' }, `Treinador: ${w.trainer_email || '-'}`),
              h('div', {}, h('button', { class: 'btn small', type: 'button', onclick: () => showWorkout(w.id) }, 'Ver exercícios')))))
          : emptyState('Nenhum treino ainda', 'Peça ao seu treinador para cadastrar o seu primeiro treino.'));
      return;
    }

    const { workouts } = await api('GET', '/api/workouts');
    const newButton = h('button', { class: 'btn primary', type: 'button', onclick: () => workoutForm() }, 'Novo treino');

    box.replaceChildren(
      pageHead('Treinos', `${workouts.length} treino(s) cadastrado(s). A lista usa cache de 30 s.`, newButton),
      workouts.length
        ? table(['Treino', 'Aluno', 'Treinador', 'Criado em', ''], workouts.map((w) => [
            h('strong', {}, w.name), w.member_name || `#${w.member_id}`, w.trainer_email || `#${w.trainer_id}`,
            fmtDate(w.created_at),
            { nodes: [
              h('button', { class: 'btn small', type: 'button', onclick: () => showWorkout(w.id) }, 'Ver'),
              canEdit(w) && h('button', { class: 'btn small', type: 'button', onclick: () => workoutForm(w) }, 'Editar'),
              state.user.role === 'admin' && h('button', { class: 'btn small danger', type: 'button', onclick: () => deleteWorkout(w) }, 'Excluir')] }]))
        : emptyState('Nenhum treino cadastrado', 'Use "Novo treino" para criar o primeiro.'));
  }

  async function showWorkout(id) {
    try {
      const { workout: w } = await api('GET', `/api/workouts/${id}`);
      const exercises = (w.exercises || '').split('\n').filter(Boolean);
      openDialog(w.name, h('dl', { class: 'detail' },
        h('dt', {}, 'Aluno'), h('dd', {}, w.member_name || `#${w.member_id}`),
        h('dt', {}, 'Treinador'), h('dd', {}, w.trainer_email || `#${w.trainer_id}`),
        h('dt', {}, 'Descrição'), h('dd', {}, w.description || 'Sem descrição'),
        h('dt', {}, 'Exercícios'),
        h('dd', {}, exercises.length ? h('ul', {}, exercises.map((line) => h('li', {}, line))) : 'Nenhum exercício informado'),
        h('dt', {}, 'Criado em'), h('dd', {}, fmtDate(w.created_at))));
    } catch (error) { toast(error.message, true); }
  }

  async function workoutForm(workout) {
    const isAdmin = state.user.role === 'admin';
    let members;
    try { members = (await api('GET', '/api/members')).members; }
    catch (error) { return toast(error.message, true); }

    if (!members.length) return toast('Cadastre um membro antes de criar treinos.', true);

    const errorBox = h('p', { class: 'form-error', role: 'alert', hidden: true });
    const form = h('form', { class: 'form' },
      field('Aluno', h('select', { name: 'memberId', required: true },
        members.map((m) => h('option', { value: m.id, selected: workout && workout.member_id === m.id }, `${m.name} (${m.email})`)))),
      isAdmin && field('ID do treinador (opcional)', h('input', { name: 'trainerId', type: 'number', min: 1, placeholder: 'Vazio = você', value: workout ? workout.trainer_id : '' })),
      field('Nome do treino', h('input', { name: 'name', required: true, minlength: 3, maxlength: 100, value: workout ? workout.name : '' })),
      field('Descrição', h('textarea', { name: 'description', rows: 2, maxlength: 1000 }, workout ? workout.description || '' : '')),
      field('Exercícios (um por linha)', h('textarea', { name: 'exercises', rows: 6, maxlength: 5000 }, workout ? workout.exercises || '' : '')),
      errorBox,
      h('div', { class: 'dialog-actions' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => $('#dialog').close() }, 'Cancelar'),
        h('button', { class: 'btn primary', type: 'submit' }, workout ? 'Salvar alterações' : 'Criar treino')));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const body = { memberId: Number(data.get('memberId')), name: data.get('name'), description: data.get('description'), exercises: data.get('exercises') };
      if (isAdmin && data.get('trainerId')) body.trainerId = Number(data.get('trainerId'));
      try {
        if (workout) await api('PUT', `/api/workouts/${workout.id}`, body);
        else await api('POST', '/api/workouts', body);
        $('#dialog').close();
        toast(workout ? 'Treino atualizado.' : 'Treino criado.');
        viewWorkouts();
      } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; }
    });

    openDialog(workout ? 'Editar treino' : 'Novo treino', form);
  }

  async function deleteWorkout(workout) {
    if (!confirm(`Excluir o treino "${workout.name}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await api('DELETE', `/api/workouts/${workout.id}`);
      toast('Treino excluído.');
      viewWorkouts();
    } catch (error) { toast(error.message, true); }
  }


  async function viewMembers() {
    const { members } = await api('GET', '/api/members');
    const action = state.user.role === 'admin'
      ? h('button', { class: 'btn primary', type: 'button', onclick: memberForm }, 'Novo membro') : null;

    $('#content').replaceChildren(
      pageHead('Membros', `${members.length} membro(s) cadastrado(s).`, action),
      members.length
        ? table(['Nome', 'E-mail', 'Telefone', 'Nascimento', 'ID'], members.map((m) =>
            [h('strong', {}, m.name), m.email, m.phone || '-', fmtDate(m.birth_date), `#${m.id}`]))
        : emptyState('Nenhum membro cadastrado', 'Os alunos também podem criar a própria conta na tela de acesso.'));
  }

  function memberForm() {
    const errorBox = h('p', { class: 'form-error', role: 'alert', hidden: true });
    const form = h('form', { class: 'form' },
      field('Nome completo', h('input', { name: 'name', required: true, minlength: 3, maxlength: 100 })),
      field('E-mail', h('input', { name: 'email', type: 'email', required: true })),
      field('Senha inicial (8 a 72 caracteres)', h('input', { name: 'password', type: 'password', required: true, minlength: 8, autocomplete: 'new-password' })),
      h('div', { class: 'row' },
        field('Telefone', h('input', { name: 'phone', maxlength: 20 })),
        field('Nascimento', h('input', { name: 'birthDate', type: 'date' }))),
      errorBox,
      h('div', { class: 'dialog-actions' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => $('#dialog').close() }, 'Cancelar'),
        h('button', { class: 'btn primary', type: 'submit' }, 'Cadastrar membro')));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const body = {};
      for (const [key, value] of new FormData(form)) if (value !== '') body[key] = value;
      try {
        await api('POST', '/api/members', body);
        $('#dialog').close();
        toast('Membro cadastrado.');
        viewMembers();
      } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; }
    });
    openDialog('Novo membro', form);
  }


  const checkinTable = (checkins, withName) => checkins.length
    ? table(withName ? ['Data', 'Hora', 'Aluno'] : ['Data', 'Hora'],
        checkins.map((c) => [fmtDate(c.checkin_date), c.checkin_time, withName ? c.member_name : null].filter((v) => v !== null)))
    : emptyState('Nenhum check-in registrado', 'Quando houver presença, ela aparece aqui.');

  async function viewCheckins() {
    const box = $('#content');

    if (isStaff()) {
      const { checkins } = await api('GET', '/api/checkins');
      box.replaceChildren(pageHead('Check-ins', `${checkins.length} presença(s) registrada(s).`), checkinTable(checkins, true));
      return;
    }

    if (!state.member) return box.replaceChildren(emptyState('Perfil de aluno não encontrado', 'Fale com a recepção.'));

    const { checkins } = await api('GET', `/api/checkins/${state.member.id}`);
    const button = h('button', { class: 'btn primary', type: 'button', onclick: async (event) => {
      event.currentTarget.disabled = true;
      try { await api('POST', '/api/checkins'); toast('Check-in registrado. Bom treino!'); viewCheckins(); }
      catch (error) { toast(error.message, true); event.currentTarget.disabled = false; }
    } }, 'Fazer check-in agora');

    box.replaceChildren(
      pageHead('Meus check-ins'),
      h('div', { class: 'checkin-hero' },
        h('div', {}, h('h3', {}, `${checkins.length} presença(s) até hoje`), h('p', {}, 'Registre sua chegada na academia.')), button),
      checkinTable(checkins, false));
  }


  function setAuthTab(tab) {
    const login = tab === 'login';
    $('#login-form').hidden = !login;
    $('#register-form').hidden = login;
    $('#tab-login').setAttribute('aria-selected', String(login));
    $('#tab-register').setAttribute('aria-selected', String(!login));
  }

  function bindAuth(formId, errorId, path, buildBody) {
    const form = $(formId);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const errorBox = $(errorId);
      const submit = form.querySelector('button[type="submit"]');
      errorBox.hidden = true;
      submit.disabled = true;
      try {
        const result = await api('POST', path, buildBody(new FormData(form)));
        form.reset();
        await startSession(result);
      } catch (error) {
        errorBox.textContent = error.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' : error.message;
        errorBox.hidden = false;
      } finally { submit.disabled = false; }
    });
  }

  function init() {
    $('#tab-login').addEventListener('click', () => setAuthTab('login'));
    $('#tab-register').addEventListener('click', () => setAuthTab('register'));
    $('#logout').addEventListener('click', () => logout());

    bindAuth('#login-form', '#login-error', '/api/auth/login',
      (data) => ({ email: data.get('email'), password: data.get('password') }));

    bindAuth('#register-form', '#register-error', '/api/auth/register', (data) => {
      const body = {};
      for (const [key, value] of data) if (value !== '') body[key] = value;
      return body;
    });

    fetch('/health').then((res) => updateStatus('GET', '/health', res)).catch(() => {});

    const saved = sessionStorage.getItem('gym_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        state.token = session.token;
        state.user = session.user;
        showApp();
      } catch { sessionStorage.removeItem('gym_session'); }
    }
  }

  init();
})();
