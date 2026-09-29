export const initNewsletterViews = async () => {
  const listContainer = document.getElementById('archive-grid');
  const detailContainer = document.getElementById('issue-detail-container');

  if (!listContainer || !detailContainer) return;

  try {
    // 1. Fetch the issues metadata
    const response = await fetch('assets/content/issues.json');
    const issues = await response.json();

    // 2. Generate the cards
    listContainer.innerHTML = ''; // clear placeholder
    issues.forEach(issue => {
      const card = document.createElement('article');
      card.className = `archive__card reveal reveal--visible ${issue.featured ? 'archive__card--featured' : ''}`;
      card.dataset.issue = issue.number; // e.g. "05"
      card.innerHTML = `
        <div class="archive__card-number">${issue.number}</div>
        <div class="archive__card-body">
          <div class="archive__card-meta">
            <span class="archive__card-label">${issue.label}</span>
          </div>
          <h3 class="archive__card-title">${issue.title}</h3>
          <p class="archive__card-excerpt">${issue.excerpt}</p>
        </div>
        <div class="archive__card-arrow">→</div>
      `;
      listContainer.appendChild(card);
    });

    // 3. Attach click listeners to load details
    const cards = document.querySelectorAll('.archive__card');
    
    cards.forEach(card => {
      card.addEventListener('click', async () => {
        const issueNum = card.dataset.issue;
        
        // Fetch HTML fragment if not already loaded
        const detailId = `issue-${parseInt(issueNum, 10)}`; // e.g. "issue-5"
        let detailEl = document.getElementById(detailId);
        
        if (!detailEl) {
          const res = await fetch(`assets/content/issues/${issueNum}.html`);
          const html = await res.text();
          // Wrap in a temp div to parse
          const temp = document.createElement('div');
          temp.innerHTML = html;
          detailEl = temp.firstElementChild;
          detailContainer.appendChild(detailEl);
          
          // Attach back button listener for the newly loaded detail view
          const backBtn = detailEl.querySelector('[data-back]');
          if (backBtn) {
            backBtn.addEventListener('click', () => {
              detailContainer.hidden = true;
              listContainer.parentElement.hidden = false; // Show archive list
              window.scrollTo({ top: listContainer.parentElement.offsetTop - 80, behavior: 'smooth' });
            });
          }
        }

        // Hide all detail views
        Array.from(detailContainer.children).forEach(child => {
          child.hidden = true;
        });

        // Show selected
        listContainer.parentElement.hidden = true; // hide the whole archive list container
        detailContainer.hidden = false;
        detailEl.hidden = false;
        
        window.scrollTo({ top: listContainer.parentElement.offsetTop - 80, behavior: 'smooth' });
      });
    });

  } catch (err) {
    console.error('Failed to load newsletter archive:', err);
  }
};
