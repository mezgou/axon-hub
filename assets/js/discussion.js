import { getComments, postComment } from './services/social.js';
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

  function updateSession() {
    login.hidden = Boolean(getSession());
    login.href = `login.html?returnTo=${encodeURIComponent(`${location.pathname.split('/').pop()}?id=${resourceId}#discussion-heading`)}`;
  }

  async function loadComments() {
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
