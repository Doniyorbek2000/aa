/* ─────────────────────────────────────────────────────────────────────────────
 * tryon-queue.js — the session queue for OUR OWN try-on pages
 *   /onboarding-extension, /onboarding-campaign, the landing demo (index.html),
 *   old_index.html. One copy, so the four cannot drift apart.
 *
 * Why these pages queue at all (QUEUE_SYSTEM.md § Our own pages): until
 * 2026-10-04 they minted straight from /api/tokens, which never touches the
 * queue. Their sessions took GPU seats the queue could not see. And when the
 * pool was full, Decart rejected the connect with "Server at capacity", which
 * the page could only report as a vague error. Now they join through
 * /api/queue/join like the extension widget does. The server puts our own
 * domains in the PRIORITY tier (isOwnPagesHost in server.js), so they are
 * served first and usually seated at once.
 *
 * Same wire contract as the widget's fetchDecartTokenViaQueue (extension repo,
 * dev/_widget_entry.js): join → poll /status every poll_ms → heartbeat every
 * 30s while streaming → leave on teardown. Two rules carried over from it:
 *   - A 4xx refusal (ban, disabled account, cap, paywall) is TERMINAL. It is
 *     thrown, never retried through /api/tokens, which would only refuse again.
 *   - Queue INFRASTRUCTURE failing (network, 5xx, a missing route) falls back to
 *     /api/tokens. The queue fails open on the server; the client does too.
 *
 * window.__awTryonQueue:
 *   acquire({ base, body, track, onWaiting, isCancelled, defaultMaxWaitMs, maxSessionSeconds })
 *     maxSessionSeconds: ask the server for a SHORTER session than the account's
 *       (it never grants a longer one). Sent on every door a token can come
 *       from — the join, every /status poll, the /api/tokens fallback — so the
 *       token's maxSessionDuration carries it whichever door admitted us. The
 *       landing demo asks for 90 (LANDING_DEMO_SESSION.md).
 *     → { token, ticketId, waitedMs }   admitted; token is the /api/tokens shape
 *     → { busy: true, waitedMs }        waited past the ceiling: the pool really
 *                                       is full, so "our servers are busy" is TRUE
 *     → { cancelled: true }             isCancelled() went true while waiting
 *     throws Error (err.httpStatus, err.code) on a refusal
 *   connectAdmitted(got, acquireOpts, connectFn)
 *     → { client, got }                 connectFn(got) resolved; `got` may be a
 *                                       NEWER admission than the one passed in
 *     → { busy: true } / { cancelled: true }   as for acquire, on the second wait
 *     throws whatever connectFn threw when it cannot be helped
 *     The SECOND GATE (DECART_SESSION_LIMIT.md): when Decart refuses a token this
 *     queue admitted ("Concurrent session limit reached."), the ticket goes back
 *     to the front of the line (POST /api/queue/requeue), the shopper waits like
 *     any waiter, and connectFn runs again with the fresh token. Up to 3 times.
 *   startHeartbeat(ticketId, token?), release()  — the token caps the seat at its session length
 *   isCapacityError(err)  — Decart refused the connect: "at capacity", or the
 *                           per-key "Concurrent session limit reached."
 *   isSessionLimitError(err) — the per-key refusal alone (the one that requeues)
 *   BUSY_MESSAGE          — the one sentence shown when either is true
 * ──────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // Shown ONLY when the pool is provably full: we waited in our own queue past
  // the ceiling, or Decart refused the connect for capacity. Any other failure
  // gets the page's generic server message — "busy" would be a lie there.
  var BUSY_MESSAGE = 'Our servers are popular and busy right now. Please try again in a minute.';
  var DEFAULT_MAX_WAIT_MS = 60000;   // when the account sets no max_queue_wait_seconds
  var HEARTBEAT_MS = 30000;          // QUEUE_SYSTEM.md § heartbeat: 180s silence frees the seat

  // A seat is never held longer than the session it was granted for. The token
  // carries that length (constraints.realtime.maxSessionDuration); Decart ends
  // the session there, so heartbeating past it only keeps an EMPTY seat.
  // 2026-10-04: a landing-demo tab left open after a 4-second try-on held a
  // priority seat for 15 minutes (until the server's 900s ceiling), because the
  // page released only on modal close.
  //
  // The slack was 60s until 2026-10-14. In the week to 2026-10-13, 211
  // landing-demo seats were freed by this timer at 360s, a full minute after
  // Decart had ended their 300s session. 10s is enough: the timer starts in
  // startHeartbeat(), which every page calls AFTER connect resolves, so Decart's
  // session clock started before ours and Decart ends the session no later than
  // sessionS after this timer starts. The 10s covers jitter, and gives Decart time to
  // tear the session down before the next shopper takes the seat
  // (DECART_SESSION_LIMIT.md § 3, the teardown lag).
  var SEAT_SLACK_S = 10;
  var DEFAULT_SESSION_S = 300;

  var MAX_REQUEUES = 3;               // the server refuses a 4th (QUEUE_MAX_REQUEUES)

  // ticketId is the seat this page holds. It is set the moment the queue ADMITS
  // us, not when the heartbeat starts: until 2026-10-13 it was set only by
  // startHeartbeat(), which runs after a successful connect — so a connect that
  // failed (or a tab closed mid-connect) never gave its seat back, and the
  // pages' "a seat we were given but could not use goes back at once" did
  // nothing. The seat sat unused for the 60s first-heartbeat grace and was
  // reaped at 180s: 675 such own-page seats on 2026-10-13 alone.
  var ticketId = null, hbTimer = null, holdTimer = null, base = '';
  var lastMaxWaitMs = null;          // the join's wait ceiling, reused on a requeue

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function refusal(res, body) {
    var e = new Error((body && (body.code || body.error)) || ('queue HTTP ' + res.status));
    e.httpStatus = res.status;
    e.code = (body && body.code) || null;
    // THE QUEUE WALL (QUEUE_WALL.md): a 'line_full' refusal carries the paywall
    // directive and the numbers the server measured when it decided. Carried on
    // the thrown error so a page can render the WALL instead of a generic
    // failure — the widget does the same off the refusal body itself.
    e.refusalCode  = (body && body.refusal_code) || null;
    e.billingUi    = (body && body.billing_ui) || null;
    e.etaSeconds   = (body && typeof body.eta_seconds === 'number') ? body.eta_seconds : null;
    e.waitingAhead = (body && typeof body.waiting_ahead === 'number') ? body.waiting_ahead : null;
    return e;
  }

  /** The free line is past the tolerated wait and the server answered the
   *  paywall instead of a place in line (QUEUE_WALL.md). The page shows the
   *  wall (err.billingUi.url), never a "busy" or error card: this shopper was
   *  refused on purpose, with a way in. */
  function isLineFull(err) {
    return Boolean(err && err.refusalCode === 'line_full' && err.billingUi && err.billingUi.url);
  }

  // 4xx = policy, terminal. Anything else (5xx, network) = infrastructure.
  function isTerminal(res) { return res.status >= 400 && res.status < 500 && res.status !== 404; }

  function postJson(url, body) {
    return fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',   // aw_vid cookie, ban-system browser identity (bans.js)
      body: JSON.stringify(body || {}),
    });
  }

  // opts.maxSessionSeconds, as the server reads it: `max_session_s` in a POST
  // body, and in the query of the /status GET. One helper per shape, so the
  // three doors cannot disagree about the name.
  function sessionCapOf(opts) {
    var s = Math.floor(Number(opts && opts.maxSessionSeconds));
    return s > 0 ? s : null;
  }
  // opts.experience — a page experience name the server maps to one of OUR
  // models (PAGE_EXPERIENCE_MODELS in server.js; the /halloween Lucy mode).
  // Carried on the same three doors as the session cap, because the waiter's
  // token is minted at the /status poll. The server validates the name; an
  // unknown or disabled one simply answers the account's model.
  function experienceOf(opts) {
    var e = opts && opts.experience;
    return (typeof e === 'string' && /^[a-z_]{1,32}$/.test(e)) ? e : null;
  }
  function bodyWithCap(opts) {
    var s = sessionCapOf(opts), e = experienceOf(opts);
    if (!s && !e) return opts.body;
    return Object.assign({}, opts.body || {},
      s ? { max_session_s: s } : {}, e ? { experience: e } : {});
  }
  function queryWithCap(opts) {
    var s = sessionCapOf(opts), e = experienceOf(opts);
    return (s ? '&max_session_s=' + s : '') + (e ? '&experience=' + encodeURIComponent(e) : '');
  }

  async function legacyToken(opts) {
    var res = await postJson(opts.base + '/api/tokens', bodyWithCap(opts));
    if (!res.ok) throw refusal(res, await res.json().catch(function () { return null; }));
    return { token: await res.json(), ticketId: null, waitedMs: 0 };
  }

  // The admitted result, with the seat recorded so release() can free it from
  // any teardown path — including a connect that never succeeded.
  function admitted(token, t, waitedMs) {
    ticketId = t || null;
    return { token: token, ticketId: t || null, waitedMs: waitedMs };
  }

  async function acquire(opts) {
    opts = opts || {};
    base = opts.base || '';
    var track = opts.track || function () {};
    var isCancelled = opts.isCancelled || function () { return false; };
    var startedAt = Date.now();
    var ticket = null;
    // opts.resumeTicket: we are ALREADY in line — the server just put this
    // ticket back after Decart refused it (requeue). Skip the join and wait.
    // The wait is reported under its own event names so queue_entered /
    // queue_completed / queue_timeout keep counting one wait per try-on (the
    // Up time card and the try-on alarm read them).
    var resumed = Boolean(opts.resumeTicket);

    try {
      var data;
      // A fresh try-on starts from no ceiling; only a requeue inherits the one
      // its own join was given (an admit-on-join response carries none).
      if (!resumed) lastMaxWaitMs = null;
      if (resumed) {
        ticket = opts.resumeTicket;
        data = { poll_ms: 100 };   // first poll at once; /status supplies the cadence after
      } else {
        var res = await postJson(base + '/api/queue/join', bodyWithCap(opts));
        if (!res.ok) {
          var errBody = await res.json().catch(function () { return null; });
          if (isTerminal(res)) throw Object.assign(refusal(res, errBody), { terminal: true });
          throw new Error('join HTTP ' + res.status);
        }
        data = await res.json();
        if (data.status === 'active' && data.token && data.token.apiKey) {
          return admitted(data.token, data.ticket_id, 0);
        }
        if (data.status !== 'waiting' || !data.ticket_id) throw new Error('unexpected join response');
        ticket = data.ticket_id;
      }

      var maxWaitMs = Number(data.maxQueueWaitSeconds) > 0
        ? Number(data.maxQueueWaitSeconds) * 1000
        : ((resumed && lastMaxWaitMs) || opts.defaultMaxWaitMs || DEFAULT_MAX_WAIT_MS);
      if (!resumed && Number(data.maxQueueWaitSeconds) > 0) lastMaxWaitMs = maxWaitMs;
      var pos = function (d) { return d.position_in_lane || d.position || null; };
      if (!resumed) {
        track('queue_entered', { position: data.position, ahead: data.ahead == null ? null : data.ahead,
                                 lane: data.lane || null, position_in_lane: data.position_in_lane || null,
                                 source: 'backend' });
        if (opts.onWaiting) opts.onWaiting(pos(data), data);
      } else if (opts.onWaiting) {
        opts.onWaiting(1, data);   // they are first in line again — say so before the first poll
      }

      var rejoined = false;
      for (;;) {
        await sleep(data.poll_ms || 2500);
        if (isCancelled()) { ticketId = ticket; release(); return { cancelled: true }; }
        if (Date.now() - startedAt > maxWaitMs) {
          ticketId = ticket; release();
          track(resumed ? 'queue_requeue_timeout' : 'queue_timeout', { waited_ms: Date.now() - startedAt });
          return { busy: true, waitedMs: Date.now() - startedAt };
        }
        var pr = await fetch(base + '/api/queue/status?ticket=' + encodeURIComponent(ticket) + queryWithCap(opts),
                             { credentials: 'include' });
        if (!pr.ok) {
          var pBody = await pr.json().catch(function () { return null; });
          if (isTerminal(pr)) { ticketId = ticket; release(); throw Object.assign(refusal(pr, pBody), { terminal: true }); }
          throw new Error('status HTTP ' + pr.status);
        }
        var s = await pr.json();
        if (s.status === 'active' && s.token && s.token.apiKey) {
          track(resumed ? 'queue_requeue_completed' : 'queue_completed', { queue_duration_ms: Date.now() - startedAt });
          return admitted(s.token, ticket, Date.now() - startedAt);
        }
        if (s.status === 'waiting') {
          if (s.poll_ms) data.poll_ms = s.poll_ms;
          if (opts.onWaiting) opts.onWaiting(pos(s), s);
          continue;
        }
        // expired / done mid-wait (a laptop slept past the waiting TTL): rejoin once.
        if (rejoined) throw new Error('queue ticket lost twice');
        rejoined = true;
        var again = await postJson(base + '/api/queue/join', bodyWithCap(opts));
        if (!again.ok) {
          var aBody = await again.json().catch(function () { return null; });
          if (isTerminal(again)) throw Object.assign(refusal(again, aBody), { terminal: true });
          throw new Error('rejoin HTTP ' + again.status);
        }
        var a = await again.json();
        if (a.status === 'active' && a.token && a.token.apiKey) {
          return admitted(a.token, a.ticket_id, Date.now() - startedAt);
        }
        ticket = a.ticket_id;
      }
    } catch (err) {
      if (err && err.terminal) throw err;
      // Leave a line we were standing in before minting around it, or the
      // abandoned ticket holds a place ahead of real shoppers until its TTL.
      if (ticket) { ticketId = ticket; release(); }
      // FAIL-OPEN, client side: queue infrastructure must never block a try-on.
      track('queue_fallback', { error: String((err && err.message) || err).slice(0, 160) });
      return legacyToken(opts);
    }
  }

  /** startHeartbeat(ticketId, token?) — pass the admitted token so the seat is
   *  released when its session can no longer be running, even if the page
   *  never tears down (a tab left open). */
  function startHeartbeat(t, token) {
    ticketId = t || null;
    if (hbTimer) clearInterval(hbTimer);
    if (holdTimer) clearTimeout(holdTimer);
    hbTimer = null; holdTimer = null;
    if (!ticketId) return;
    var sessionS = Number(token && token.constraints && token.constraints.realtime &&
                          token.constraints.realtime.maxSessionDuration) || DEFAULT_SESSION_S;
    holdTimer = setTimeout(release, (sessionS + SEAT_SLACK_S) * 1000);
    hbTimer = setInterval(function () {
      fetch(base + '/api/queue/heartbeat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId }), keepalive: true,
      }).catch(function () {});
    }, HEARTBEAT_MS);
  }

  /** Free the seat. Idempotent; call it from every teardown path. The server's
   *  TTL is the safety net if it never fires. */
  function release() {
    if (hbTimer) { clearInterval(hbTimer); hbTimer = null; }
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    if (!ticketId) return;
    var payload = JSON.stringify({ ticket_id: ticketId });
    ticketId = null;
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(base + '/api/queue/leave', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(base + '/api/queue/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                           body: payload, keepalive: true }).catch(function () {});
      }
    } catch (_) {}
  }

  // Decart refused the connect for lack of room. Two refusals, one meaning for
  // the shopper ("busy" is TRUE): the pool's "Server at capacity", and the
  // per-API-key "Concurrent session limit reached." (DECART_SESSION_LIMIT.md).
  function isCapacityError(err) {
    return /capacity|concurrent session limit/i.test(String((err && err.message) || err || ''));
  }
  function isSessionLimitError(err) {
    return /concurrent session limit/i.test(String((err && err.message) || err || ''));
  }

  /** Hand an admitted ticket back after Decart refused it, and wait in line
   *  again. → an acquire() result, or null when the server would not take it
   *  back (old database, too many requeues, not seated) — then the caller does
   *  what it did before. Never throws. */
  async function requeue(t, opts) {
    opts = opts || {};
    var track = opts.track || function () {};
    var b = opts.base != null ? opts.base : base;
    try {
      var res = await postJson(b + '/api/queue/requeue', { ticket_id: t, reason: 'session_limit' });
      var body = await res.json().catch(function () { return null; });
      if (!res.ok || !body || body.status !== 'waiting') {
        track('queue_requeue_refused', { reason: (body && body.reason) || ('http_' + res.status) });
        return null;
      }
      track('queue_requeued', { requeues: body.requeues || null });
      // The seat is no longer ours: nothing to release until we are admitted again.
      if (ticketId === t) ticketId = null;
      return await acquire(Object.assign({}, opts, { resumeTicket: t }));
    } catch (_) {
      return null;
    }
  }

  /** connectFn(got) → the realtime client, with the second gate handled (see
   *  the header). connectFn must build its client from got.token every time:
   *  a requeued shopper is admitted with a FRESH token. */
  async function connectAdmitted(got, opts, connectFn) {
    for (var i = 0; ; i++) {
      try {
        return { client: await connectFn(got), got: got };
      } catch (err) {
        if (!isSessionLimitError(err) || !got || !got.ticketId || i >= MAX_REQUEUES) throw err;
        var back = await requeue(got.ticketId, opts);
        if (!back) throw err;
        if (back.cancelled || back.busy) return back;
        got = back;
      }
    }
  }

  try { window.addEventListener('pagehide', release); } catch (_) {}

  window.__awTryonQueue = {
    acquire: acquire, startHeartbeat: startHeartbeat, release: release,
    connectAdmitted: connectAdmitted, requeue: requeue,
    isCapacityError: isCapacityError, isSessionLimitError: isSessionLimitError, BUSY_MESSAGE: BUSY_MESSAGE,
    isLineFull: isLineFull,
    _ticket: function () { return ticketId; },
  };
})();
