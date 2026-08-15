/* ========================================
   BIODYN , Cards
   Adds the glow and rule elements, and points
   the glow at the cursor. Research Outputs
   cards are rendered from JSON after this runs,
   so new cards are picked up as they appear.
   ======================================== */

(() => {
  'use strict';

  const SELECTOR = '.research-card, .pub-card, .collab-card, .team-card';
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const decorate = (card) => {
    if (card.dataset.cardDressed) return;
    card.dataset.cardDressed = 'true';

    const glow = document.createElement('span');
    glow.className = 'card-glow';
    glow.setAttribute('aria-hidden', 'true');
    const rule = document.createElement('span');
    rule.className = 'card-rule';
    rule.setAttribute('aria-hidden', 'true');
    card.prepend(rule);
    card.prepend(glow);

    if (!fine) return;
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  };

  const sweep = (root) => {
    const scope = root || document;
    if (scope.matches && scope.matches(SELECTOR)) decorate(scope);
    scope.querySelectorAll(SELECTOR).forEach(decorate);
  };

  /* The hero actions get the same tracked light, without the rule or ticks. */
  const dressButton = (button) => {
    if (button.dataset.btnDressed) return;
    button.dataset.btnDressed = 'true';
    const glow = document.createElement('span');
    glow.className = 'btn-glow';
    glow.setAttribute('aria-hidden', 'true');
    button.prepend(glow);
    if (!fine) return;
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      button.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      button.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  };

  document.querySelectorAll('.hero .btn-primary, .hero .btn-secondary').forEach(dressButton);

  sweep();

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === 1) sweep(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
