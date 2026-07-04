import { GAME_DEFINITION, UI_LABELS } from '../config/gameDefinition.js';
import { getLevel, TOTAL_LEVELS } from '../config/levels.js';
import { calculateStars, renderEarnedStars } from '../utils/stars.js';

function statusClass(status) {
  if (status === true) return 'valid';
  if (status === false) return 'invalid';
  return 'pending';
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function parseDragPayload(dataTransfer) {
  try { return JSON.parse(dataTransfer.getData('application/json')); } catch { return null; }
}

function setDragPayload(dataTransfer, payload) {
  dataTransfer.setData('application/json', JSON.stringify(payload));
  dataTransfer.effectAllowed = 'move';
}

export function createGameView(container, engine, {
  onBack, onLevels, onNextLevel, onSettings, onStats, onComingSoon, soundManager, settingsStore, progressStore,
}) {
  let unsubscribe = null;
  let wasWin = false;
  let touchDrag = null;
  let elapsed = 0;
  let timerId = null;
  let paused = false;
  let showPause = false;
  let showGameOver = false;
  let showConfirmRestart = false;
  let victoryOverlay = null;
  let wasGameOver = false;
  let wasError = false;

  function startTimer() {
    stopTimer();
    elapsed = 0;
    paused = false;
    timerId = setInterval(() => {
      if (!paused && !showPause) {
        elapsed += 1;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function updateTimerDisplay() {
    const el = container.querySelector('[data-timer]');
    if (el) el.textContent = formatTime(elapsed);
  }

  function getConditionStatus(cond, validation) {
    const { groups } = validation;
    if (cond.type === 'rows') return groups.rows;
    if (cond.type === 'cols') return groups.cols;
    if (cond.type === 'diagonal') return validation.diagonals[cond.index];
    return null;
  }

  function getCheckIcon(status) {
    if (status === true) return '✓';
    if (status === false) return '✗';
    return '○';
  }

  function isLocked(state, r, c) {
    return state.lockedCells.includes(`${r},${c}`);
  }

  function handleDrop(target, payload, state) {
    if (!payload?.number) return;
    if (target.type === 'cell') {
      if (isLocked(state, target.row, target.col)) return;
      if (payload.source === 'pool') { engine.assignNumber(target.row, target.col, payload.number); soundManager?.playPlace(); }
      else if (payload.source === 'cell' && !isLocked(state, payload.row, payload.col)) {
        engine.moveNumber(payload.row, payload.col, target.row, target.col);
        soundManager?.playPlace();
      }
    } else if (target.type === 'pool' && payload.source === 'cell' && !isLocked(state, payload.row, payload.col)) {
      engine.assignNumber(payload.row, payload.col, null);
      soundManager?.playRemove();
    }
  }

  function renderPoolNumbers(pool, availableNumbers, selectedNumber, gridSize) {
    const perRow = gridSize <= 3 ? 5 : gridSize <= 4 ? 8 : 9;
    const rows = [];
    for (let i = 0; i < pool.length; i += perRow) {
      rows.push(pool.slice(i, i + perRow));
    }
    const renderRow = (nums) => nums.map((num) => {
      const used = !availableNumbers.includes(num);
      const sel = selectedNumber === num;
      return `<button type="button" class="pool-number ${used ? 'used' : ''} ${sel ? 'selected' : ''}"
        data-number="${num}" draggable="${!used}" ${used ? 'disabled' : ''}>${num}</button>`;
    }).join('');
    return rows.map((nums) => `<div class="number-pool-row">${renderRow(nums)}</div>`).join('');
  }

  function showVictoryModal() {
    if (victoryOverlay) return;
    const levelId = engine.currentLevel?.id ?? 1;
    const stars = calculateStars({
      time: elapsed,
      hintsUsed: engine.hintsUsed,
      errorsCount: engine.errorsCount,
      gridSize: engine.currentLevel?.gridSize ?? 3,
    });
    progressStore.completeLevel(levelId, {
      time: elapsed,
      hintsUsed: engine.hintsUsed,
      errorsCount: engine.errorsCount,
      stars,
    });

    const newAchievements = progressStore.consumePendingAchievements();
    const achMsg = newAchievements.length
      ? `<p class="victory-achievement">🏆 ${newAchievements.map((a) => a.title).join(', ')}</p>`
      : '';

    victoryOverlay = document.createElement('div');
    victoryOverlay.className = 'victory-overlay';
    victoryOverlay.innerHTML = `
      <div class="victory-modal">
        <div class="victory-confetti" aria-hidden="true"></div>
        <div class="victory-icon">🏆</div>
        <h2>${UI_LABELS.game.victoryShort}</h2>
        <p class="victory-msg">${UI_LABELS.game.victory}</p>
        ${achMsg}
        <div class="victory-stars-earned">${renderEarnedStars(stars, { maxDisplay: 3, className: 'victory-star' })}</div>
        <div class="victory-stats">
          <div><span>${UI_LABELS.game.time}</span><strong>${formatTime(elapsed)}</strong></div>
          <div><span>${UI_LABELS.game.hintsUsed}</span><strong>${engine.hintsUsed}</strong></div>
          <div><span>${UI_LABELS.game.errors}</span><strong>${engine.errorsCount}</strong></div>
        </div>
        <button type="button" class="victory-btn victory-btn--primary" data-action="next">${UI_LABELS.game.nextLevel}</button>
        <button type="button" class="victory-btn victory-btn--secondary" data-action="again">${UI_LABELS.game.tryAgain}</button>
      </div>`;
    document.body.appendChild(victoryOverlay);
    document.body.classList.add('victory-open');
    victoryOverlay.querySelector('[data-action="again"]').addEventListener('click', () => {
      hideVictoryModal();
      engine.restartLevel();
      startTimer();
      wasWin = false;
      render(engine.getState());
    });
    victoryOverlay.querySelector('[data-action="next"]').addEventListener('click', () => {
      hideVictoryModal();
      onNextLevel(levelId + 1);
    });
  }

  function hideVictoryModal() {
    victoryOverlay?.remove();
    victoryOverlay = null;
    document.body.classList.remove('victory-open');
  }

  function render(state) {
    const { board, selectedNumber, availableNumbers, validation, hintsRemaining, canUndo, gridConfig, hasError } = state;
    const { targetSum, winConditions, numbers } = gridConfig;
    const { title } = GAME_DEFINITION;
    const gridSize = board.length;
    const { isWin } = validation;
    const levelName = engine.currentLevel?.name ?? UI_LABELS.game.level ?? 'Nível 1';
    const levelTitle = engine.currentLevel?.title ?? '';
    const levelObjective = engine.currentLevel?.objective ?? '';
    const settings = settingsStore.get();

    if (isWin && !wasWin) { showVictoryModal(); soundManager?.playWin(); stopTimer(); }
    if (!isWin && wasWin) hideVictoryModal();
    wasWin = isWin;

    const shouldGameOver = !isWin && engine.isGameOver(settings.showErrors);
    if (shouldGameOver && !wasGameOver) {
      soundManager?.playLose();
      soundManager?.pauseMusic();
      stopTimer();
    }
    wasGameOver = shouldGameOver;
    showGameOver = shouldGameOver;

    if (state.hasError && !wasError && settings.showErrors) {
      soundManager?.playError();
    }
    wasError = state.hasError;

    container.innerHTML = `
      <div class="game-screen game-screen--grid-${gridSize} ${isWin ? 'game-screen--won' : ''}">
        <header class="game-header">
          <button type="button" class="header-btn header-btn--back" data-action="back">←</button>
          <span class="game-level">${levelName}${levelTitle ? ` — ${levelTitle}` : ''}</span>
          <div class="game-header-right">
            <button type="button" class="header-btn header-btn--hint" data-action="hint-top" aria-label="Dica">💡</button>
            <span class="game-timer" data-timer>${formatTime(elapsed)}</span>
            <button type="button" class="header-btn header-btn--pause" data-action="pause">${paused ? '▶' : '⏸'}</button>
          </div>
        </header>

        <div class="game-card">
          <header class="game-title-block">
            <div class="title-spark title-spark--left" aria-hidden="true"></div>
            <h1 class="game-main-title">${title}</h1>
            <div class="title-spark title-spark--right" aria-hidden="true"></div>
          </header>

          <div class="instruction-banner"><p>${levelObjective || `Complete o quadrado ${engine.currentLevel?.gridLabel ?? '3×3'} com soma ${targetSum}.`}</p></div>

          <div class="game-play-area">
            <div class="grid-wrapper">
              <div class="magic-grid magic-grid--size-${gridSize} ${isWin ? 'magic-grid--won' : ''}" role="grid" style="--grid-cells: ${gridSize}">
                ${board.map((row, r) => row.map((cell, c) => {
                  const locked = isLocked(state, r, c);
                  return `<button type="button"
                    class="grid-cell ${cell !== null ? 'filled' : ''} ${locked ? 'locked' : ''} ${selectedNumber !== null && cell === null && !locked ? 'highlight' : ''}"
                    data-row="${r}" data-col="${c}" role="gridcell"
                    ${cell !== null && !locked ? `draggable="true" data-number="${cell}"` : ''}>
                    ${cell ?? ''}
                  </button>`;
                }).join('')).join('')}
              </div>
            </div>

            <aside class="game-sidebar">
              <div class="sidebar-panel sidebar-panel--objective">
                <div class="panel-label">${UI_LABELS.objective.title}</div>
                <p class="objective-text">${levelObjective || UI_LABELS.objective.description}</p>
                <div class="objective-number-wrap">
                  <span class="num-spark num-spark--left" aria-hidden="true"></span>
                  <span class="objective-number">${targetSum}</span>
                  <span class="num-spark num-spark--right" aria-hidden="true"></span>
                </div>
              </div>
              <div class="sidebar-panel sidebar-panel--progress">
                <div class="panel-label">${UI_LABELS.progress.title}</div>
                <div class="checklist-box">
                  ${winConditions.map((cond) => {
                    const st = getConditionStatus(cond, validation);
                    return `<div class="checklist-item checklist-item--${statusClass(st)}">
                      <span class="check-icon">${getCheckIcon(st)}</span><span>${cond.label}</span></div>`;
                  }).join('')}
                </div>
              </div>
            </aside>
          </div>

          <section class="number-pool-section">
            <div class="number-pool" data-drop-zone="pool">
              ${renderPoolNumbers(numbers, availableNumbers, selectedNumber, gridSize)}
            </div>
          </section>

          <div class="hint-banner"><span class="hint-icon">💡</span><p>${UI_LABELS.pool.hint}</p></div>
        </div>

        <footer class="game-toolbar">
          <button type="button" class="toolbar-btn" data-action="undo" ${!canUndo ? 'disabled' : ''}>
            <span class="toolbar-icon">↩</span><span>${UI_LABELS.game.undo}</span>
          </button>
          <button type="button" class="toolbar-btn" data-action="erase">
            <span class="toolbar-icon">⌫</span><span>${UI_LABELS.game.erase}</span>
          </button>
          <button type="button" class="toolbar-btn" data-action="restart">
            <span class="toolbar-icon">↻</span><span>${UI_LABELS.game.restart}</span>
          </button>
          <button type="button" class="toolbar-btn toolbar-btn--hint" data-action="hint">
            <span class="toolbar-icon">💡</span><span>${UI_LABELS.game.hint}</span>
            <span class="toolbar-badge">${hintsRemaining}</span>
          </button>
        </footer>

        ${showPause ? `
          <div class="overlay-menu" data-overlay="pause">
            <div class="overlay-menu-card">
              <h2>${UI_LABELS.game.pauseTitle}</h2>
              <button type="button" data-pause="continue">${UI_LABELS.game.pauseContinue}</button>
              <button type="button" data-pause="restart" class="danger">${UI_LABELS.game.pauseRestart}</button>
              <button type="button" data-pause="undo" ${!canUndo ? 'disabled' : ''}>${UI_LABELS.game.pauseUndo}</button>
              <button type="button" data-pause="levels">${UI_LABELS.game.pauseLevels}</button>
              <button type="button" data-pause="stats">${UI_LABELS.game.pauseStats}</button>
              <button type="button" data-pause="settings">${UI_LABELS.game.pauseSettings}</button>
              <button type="button" data-pause="exit" class="danger">${UI_LABELS.game.pauseExit}</button>
            </div>
          </div>` : ''}

        ${showGameOver ? `
          <div class="overlay-menu" data-overlay="gameover">
            <div class="overlay-menu-card overlay-menu-card--gameover">
              <div class="gameover-icon">😞</div>
              <h2>${UI_LABELS.game.gameOver}</h2>
              <p>${UI_LABELS.game.gameOverMsg}</p>
              <button type="button" class="gameover-btn" data-action="gameover-restart">${UI_LABELS.game.restartMatch}</button>
            </div>
          </div>` : ''}

        ${showConfirmRestart ? `
          <div class="overlay-menu" data-overlay="confirm">
            <div class="overlay-menu-card overlay-menu-card--confirm">
              <p>${UI_LABELS.game.confirmRestart}</p>
              <button type="button" class="confirm-btn confirm-btn--yes" data-action="confirm-yes">${UI_LABELS.game.confirmYes}</button>
              <button type="button" class="confirm-btn confirm-btn--no" data-action="confirm-no">${UI_LABELS.game.confirmCancel}</button>
            </div>
          </div>` : ''}
      </div>`;

    bindEvents(state);
  }

  function requestRestart() {
    if (settingsStore.get().confirmRestart) {
      showConfirmRestart = true;
      render(engine.getState());
    } else {
      engine.restartLevel();
      startTimer();
      showGameOver = false;
      render(engine.getState());
    }
  }

  function bindEvents(state) {
    container.querySelector('[data-action="back"]')?.addEventListener('click', onBack);
    container.querySelector('[data-action="pause"]')?.addEventListener('click', () => {
      showPause = true;
      paused = true;
      soundManager?.pauseMusic();
      render(engine.getState());
    });
    container.querySelector('[data-action="undo"]')?.addEventListener('click', () => engine.undo());
    container.querySelector('[data-action="erase"]')?.addEventListener('click', () => { engine.eraseSelected(); soundManager?.playRemove(); });
    container.querySelector('[data-action="restart"]')?.addEventListener('click', requestRestart);
    container.querySelectorAll('[data-action="hint"], [data-action="hint-top"]').forEach((btn) => {
      btn.addEventListener('click', () => { if (engine.useHint()) soundManager?.playSelect(); });
    });
    container.querySelector('[data-action="gameover-restart"]')?.addEventListener('click', () => {
      showGameOver = false;
      wasGameOver = false;
      wasError = false;
      engine.restartLevel();
      startTimer();
      soundManager?.resumeMusic();
      render(engine.getState());
    });
    container.querySelector('[data-action="confirm-yes"]')?.addEventListener('click', () => {
      showConfirmRestart = false;
      showGameOver = false;
      engine.restartLevel();
      startTimer();
      render(engine.getState());
    });
    container.querySelector('[data-action="confirm-no"]')?.addEventListener('click', () => {
      showConfirmRestart = false;
      render(engine.getState());
    });

    container.querySelectorAll('[data-pause]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.pause;
        showPause = false;
        if (action === 'continue') { paused = false; soundManager?.resumeMusic(); render(engine.getState()); }
        else if (action === 'restart') requestRestart();
        else if (action === 'undo') engine.undo();
        else if (action === 'levels') onLevels();
        else if (action === 'stats') onStats();
        else if (action === 'settings') onSettings();
        else if (action === 'exit') onBack();
      });
    });

    container.querySelectorAll('.grid-cell').forEach((cell) => {
      const r = +cell.dataset.row, c = +cell.dataset.col;
      if (isLocked(state, r, c)) return;

      cell.addEventListener('click', () => {
        const had = cell.dataset.number;
        engine.placeNumber(r, c);
        if (had) soundManager?.playRemove();
        else if (engine.getState().board[r][c]) soundManager?.playPlace();
      });

      cell.addEventListener('dragstart', (e) => {
        if (!cell.dataset.number) { e.preventDefault(); return; }
        cell.classList.add('dragging');
        setDragPayload(e.dataTransfer, { source: 'cell', number: +cell.dataset.number, row: r, col: c });
      });
      cell.addEventListener('dragend', () => cell.classList.remove('dragging'));
      cell.addEventListener('dragover', (e) => { e.preventDefault(); cell.classList.add('drop-target'); });
      cell.addEventListener('dragleave', () => cell.classList.remove('drop-target'));
      cell.addEventListener('drop', (e) => {
        e.preventDefault();
        cell.classList.remove('drop-target');
        handleDrop({ type: 'cell', row: r, col: c }, parseDragPayload(e.dataTransfer), engine.getState());
      });
    });

    const pool = container.querySelector('.number-pool');
    pool?.addEventListener('dragover', (e) => { e.preventDefault(); pool.classList.add('drop-target'); });
    pool?.addEventListener('dragleave', (e) => { if (!pool.contains(e.relatedTarget)) pool.classList.remove('drop-target'); });
    pool?.addEventListener('drop', (e) => {
      e.preventDefault();
      pool.classList.remove('drop-target');
      handleDrop({ type: 'pool' }, parseDragPayload(e.dataTransfer), engine.getState());
    });

    container.querySelectorAll('.pool-number:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => { engine.selectNumber(+btn.dataset.number); soundManager?.playSelect(); });
      btn.addEventListener('dragstart', (e) => {
        btn.classList.add('dragging');
        setDragPayload(e.dataTransfer, { source: 'pool', number: +btn.dataset.number });
      });
      btn.addEventListener('dragend', () => btn.classList.remove('dragging'));
    });

    bindTouchDrag(state);
  }

  function bindTouchDrag(state) {
    const getDragSource = (el) => {
      if (!el) return null;
      if (el.classList.contains('pool-number') && !el.disabled) return { source: 'pool', number: +el.dataset.number, el };
      if (el.classList.contains('grid-cell') && el.dataset.number) {
        const r = +el.dataset.row, c = +el.dataset.col;
        if (isLocked(state, r, c)) return null;
        return { source: 'cell', number: +el.dataset.number, row: r, col: c, el };
      }
      return null;
    };

    const getDropTarget = (x, y) => {
      const el = document.elementFromPoint(x, y);
      const cell = el?.closest('.grid-cell');
      if (cell && container.contains(cell)) return { type: 'cell', row: +cell.dataset.row, col: +cell.dataset.col, el: cell };
      const poolEl = el?.closest('.number-pool');
      if (poolEl && container.contains(poolEl)) return { type: 'pool', el: poolEl };
      return null;
    };

    container.addEventListener('touchstart', (e) => {
      const src = getDragSource(e.target.closest('.pool-number, .grid-cell'));
      if (!src) return;
      touchDrag = { ...src, ghost: null };
      src.el.classList.add('dragging');
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!touchDrag) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (!touchDrag.ghost) {
        const ghost = touchDrag.el.cloneNode(true);
        ghost.className = 'drag-ghost';
        ghost.style.left = `${touch.clientX}px`;
        ghost.style.top = `${touch.clientY}px`;
        document.body.appendChild(ghost);
        touchDrag.ghost = ghost;
      } else {
        touchDrag.ghost.style.left = `${touch.clientX}px`;
        touchDrag.ghost.style.top = `${touch.clientY}px`;
      }
      container.querySelectorAll('.drop-target').forEach((n) => n.classList.remove('drop-target'));
      getDropTarget(touch.clientX, touch.clientY)?.el?.classList.add('drop-target');
    }, { passive: false });

    const endTouchDrag = (e) => {
      if (!touchDrag) return;
      const touch = e.changedTouches[0];
      const target = getDropTarget(touch.clientX, touch.clientY);
      if (target) {
        handleDrop(
          target.type === 'cell' ? { type: 'cell', row: target.row, col: target.col } : { type: 'pool' },
          touchDrag,
          engine.getState()
        );
      }
      touchDrag.el.classList.remove('dragging');
      touchDrag.ghost?.remove();
      touchDrag = null;
    };

    container.addEventListener('touchend', endTouchDrag);
    container.addEventListener('touchcancel', endTouchDrag);
  }

  return {
    startLevel(levelId) {
      engine.loadLevel(getLevel(levelId));
      progressStore.recordGameStart();
      wasWin = false;
      wasGameOver = false;
      wasError = false;
      showPause = false;
      showGameOver = false;
      showConfirmRestart = false;
      hideVictoryModal();
      startTimer();
      render(engine.getState());
    },
    mount(levelId = 1) {
      unsubscribe = engine.subscribe(render);
      this.startLevel(levelId);
    },
    unmount() {
      stopTimer();
      hideVictoryModal();
      soundManager?.stopMusic();
      wasWin = false;
      wasGameOver = false;
      wasError = false;
      touchDrag?.ghost?.remove();
      touchDrag = null;
      unsubscribe?.();
    },
  };
}
