import { getComments, postComment, editComment, deleteComment } from './services/social.js';
import { getSession } from './session.js';

export function initDiscussion(resourceId) {
  const form = document.querySelector('#comment-form');
  if (form.dataset.initialized) return;
  form.dataset.initialized = 'true';
  const field = form.elements.body;
  const submit = form.querySelector('button');
  const list = document.querySelector('#comment-list');
  const status = document.querySelector('#comments-status');
  const postStatus = document.querySelector('#comment-status');
  const error = document.querySelector('#comment-error');
  const retry = document.querySelector('#retry-comments');
  const login = document.querySelector('#comment-login');
  let loadId = 0;
  let activeEditor = false;

  function ownerControls(row, comment) {
    if (getSession()?.user.id !== comment.userId) return;
    const controls = document.createElement('div');
    controls.className = 'd-flex flex-wrap gap-2';
    function button(text) {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'btn btn-outline-primary';
      element.textContent = text;
      return element;
    }
    const edit = button('Edit');
    const remove = button('Delete');
    controls.append(edit, remove);
    row.append(controls);

    function openEditor(deleting) {
      if (activeEditor || submit.disabled || retry.disabled || getSession()?.user.id !== comment.userId) return;
      activeEditor = true;
      postStatus.textContent = '';
      submit.disabled = true;
      retry.disabled = true;
      controls.hidden = true;
      controls.classList.remove('d-flex');
      const panel = document.createElement('div');
      const label = document.createElement('label');
      const input = document.createElement('textarea');
      input.id = `edit-comment-${comment.id}`;
      input.className = 'form-control mb-3';
      input.rows = 3;
      input.maxLength = 1000;
      input.value = comment.body;
      label.htmlFor = input.id;
      label.textContent = 'Edit your comment';
      const message = document.createElement('p');
      message.setAttribute('role', 'status');
      message.id = `edit-status-${comment.id}`;
      input.setAttribute('aria-describedby', message.id);
      input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); message.textContent = ''; });
      const save = button(deleting ? 'Confirm delete' : 'Save changes');
      const cancel = button('Cancel');
      const actions = document.createElement('div');
      actions.className = 'd-flex flex-wrap gap-2';
      actions.append(save, cancel);
      if (deleting) message.textContent = 'Delete this comment? This cannot be undone.';
      else panel.append(label, input);
      panel.append(message, actions);
      row.append(panel);
      (deleting ? cancel : input).focus();
      function close() {
        panel.remove();
        controls.hidden = false;
        controls.classList.add('d-flex');
        activeEditor = false;
        submit.disabled = false;
        retry.disabled = false;
      }
      cancel.addEventListener('click', () => { close(); (deleting ? remove : edit).focus(); });
      save.addEventListener('click', async () => {
        if (save.disabled) return;
        const body = input.value.trim();
        if (!deleting && (!body || body.length > 1000)) {
          message.textContent = 'Use 1–1000 characters.';
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          return;
        }
        save.disabled = cancel.disabled = true;
        input.readOnly = true;
        message.textContent = deleting ? 'Deleting comment…' : 'Saving changes…';
        try {
          if (deleting) await deleteComment(comment.id);
          else await editComment(comment.id, body);
          close();
          if (deleting) {
            row.remove();
            status.textContent = `Comment deleted. ${list.children.length} comments remaining.`;
            status.focus();
          } else {
            comment.body = body;
            row.querySelector('[data-body]').textContent = body;
            postStatus.textContent = 'Comment updated.';
            edit.focus();
          }
        } catch (failure) {
          message.textContent = failure.status === 404 ? 'This comment no longer exists. Cancel and reload comments.'
            : failure.status === 401 ? 'Your session expired. Your text is preserved; log in to continue.'
            : failure.status === 403 ? 'You do not have permission to change this comment.'
            : 'Could not confirm the change. Your text is preserved. Cancel and reload before retrying.';
          updateSession();
          retry.hidden = false;
        } finally { save.disabled = cancel.disabled = false; input.readOnly = false; }
      });
    }
    edit.addEventListener('click', () => openEditor(false));
    remove.addEventListener('click', () => openEditor(true));
  }

  function updateSession() {
    login.hidden = Boolean(getSession());
    login.href = `login.html?returnTo=${encodeURIComponent(`${location.pathname.split('/').pop()}?id=${resourceId}#discussion-heading`)}`;
  }

  async function loadComments() {
    if (activeEditor) return;
    const requestId = ++loadId;
    const restoreFocus = document.activeElement === retry;
    retry.disabled = true;
    list.setAttribute('aria-busy', 'true');
    status.textContent = 'Loading comments…';
    try {
      const rows = await getComments(resourceId);
      if (requestId !== loadId) return;
      list.replaceChildren(...rows.map(comment => {
        const row = document.querySelector('#comment-template').content.firstElementChild.cloneNode(true);
        row.querySelector('.axon-avatar').textContent = comment.authorName.trim().split(/\s+/)
          .slice(0, 2).map(word => [...word][0] || '').join('').toUpperCase();
        row.querySelector('[data-author]').textContent = comment.authorName;
        const time = row.querySelector('time');
        time.dateTime = comment.createdAt;
        time.textContent = new Date(comment.createdAt).toLocaleString();
        row.querySelector('[data-body]').textContent = comment.body;
        ownerControls(row, comment);
        return row;
      }));
      status.textContent = rows.length ? `${rows.length} ${rows.length === 1 ? 'comment' : 'comments'}`
        : 'No comments yet. Start the discussion.';
      retry.hidden = true;
      if (restoreFocus) status.focus();
    } catch {
      if (requestId !== loadId) return;
      status.textContent = 'Could not refresh comments. Any comments shown may be outdated.';
      retry.hidden = false;
    } finally {
      if (requestId === loadId) { retry.disabled = false; list.setAttribute('aria-busy', 'false'); }
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const body = field.value.trim();
    error.textContent = body.length < 1 || body.length > 1000 ? 'Write a comment using 1–1000 characters.' : '';
    field.setAttribute('aria-invalid', String(Boolean(error.textContent)));
    if (error.textContent) { field.focus(); return; }
    const session = getSession();
    if (!session) {
      updateSession();
      postStatus.textContent = 'Log in to post a comment. Your draft has not been sent.';
      login.focus();
      return;
    }
    submit.disabled = true;
    field.readOnly = true;
    postStatus.textContent = 'Posting comment…';
    try {
      await postComment(resourceId, session.user, body);
      field.value = '';
      postStatus.textContent = 'Comment posted.';
      await loadComments();
    } catch (failure) {
      postStatus.textContent = failure.status === 401 ? 'Your session expired. Log in to post. Your draft is still here.'
        : 'Could not confirm posting. Your draft is still here. Reload comments before trying again.';
      retry.hidden = false;
      updateSession();
    } finally { submit.disabled = false; field.readOnly = false; }
  });
  field.addEventListener('input', () => { error.textContent = ''; field.removeAttribute('aria-invalid'); });
  retry.addEventListener('click', loadComments);
  window.addEventListener('pageshow', event => { if (event.persisted) { updateSession(); loadComments(); } });
  submit.disabled = false;
  updateSession();
  loadComments();
}
