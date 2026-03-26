const DATA_URL = 'content/site-data.json';

const state = {
  data: {
    projects: [],
    articles: []
  }
};

const defaults = {
  owner: 'Biodyn-AI',
  repo: 'website',
  branch: 'main',
  path: 'content/site-data.json'
};

const elements = {
  ownerInput: document.getElementById('ownerInput'),
  repoInput: document.getElementById('repoInput'),
  branchInput: document.getElementById('branchInput'),
  pathInput: document.getElementById('pathInput'),
  tokenInput: document.getElementById('tokenInput'),
  messageInput: document.getElementById('messageInput'),
  statusMessage: document.getElementById('statusMessage'),
  projectsEditor: document.getElementById('projectsEditor'),
  articlesEditor: document.getElementById('articlesEditor'),
  addProjectButton: document.getElementById('addProjectButton'),
  addArticleButton: document.getElementById('addArticleButton'),
  reloadButton: document.getElementById('reloadButton'),
  downloadButton: document.getElementById('downloadButton'),
  publishButton: document.getElementById('publishButton')
};

const statusOptions = ['Active', 'Watchlist', 'Paused', 'Completed'];

const createDefaultProject = () => ({
  title: '',
  summary: '',
  status: 'Active',
  url: ''
});

const createDefaultArticle = () => ({
  type: 'Technical Report',
  title: '',
  summary: '',
  metaPrimary: 'Draft',
  metaTag: 'Research',
  url: '',
  linkText: 'Read article'
});

const setStatus = (message, type = 'info') => {
  elements.statusMessage.textContent = message;
  elements.statusMessage.dataset.type = type;
};

const normalizeText = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

const normalizeData = (rawData) => {
  const input = rawData && typeof rawData === 'object' ? rawData : {};

  const projects = Array.isArray(input.projects)
    ? input.projects.map((project) => ({
      title: normalizeText(project.title),
      summary: normalizeText(project.summary),
      status: normalizeText(project.status, 'Active'),
      url: normalizeText(project.url)
    }))
    : [];

  const articles = Array.isArray(input.articles)
    ? input.articles.map((article) => ({
      type: normalizeText(article.type, 'Technical Report'),
      title: normalizeText(article.title),
      summary: normalizeText(article.summary),
      metaPrimary: normalizeText(article.metaPrimary, 'Draft'),
      metaTag: normalizeText(article.metaTag, 'Research'),
      url: normalizeText(article.url),
      linkText: normalizeText(article.linkText, 'Read article')
    }))
    : [];

  return { projects, articles };
};

const getSettings = () => ({
  owner: normalizeText(elements.ownerInput.value, defaults.owner),
  repo: normalizeText(elements.repoInput.value, defaults.repo),
  branch: normalizeText(elements.branchInput.value, defaults.branch),
  path: normalizeText(elements.pathInput.value, defaults.path)
});

const saveSettings = () => {
  const settings = getSettings();
  localStorage.setItem('biodyn-admin-settings', JSON.stringify(settings));
};

const loadSettings = () => {
  const saved = localStorage.getItem('biodyn-admin-settings');

  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    elements.ownerInput.value = normalizeText(parsed.owner, defaults.owner);
    elements.repoInput.value = normalizeText(parsed.repo, defaults.repo);
    elements.branchInput.value = normalizeText(parsed.branch, defaults.branch);
    elements.pathInput.value = normalizeText(parsed.path, defaults.path);
  } catch (error) {
    console.warn('Could not parse saved settings:', error);
  }
};

const moveItem = (array, from, to) => {
  if (to < 0 || to >= array.length) {
    return;
  }

  const [item] = array.splice(from, 1);
  array.splice(to, 0, item);
};

const createInput = ({ label, value, onChange, type = 'text', placeholder = '' }) => {
  const wrapper = document.createElement('label');
  const text = document.createElement('span');
  text.textContent = label;

  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  input.addEventListener('input', (event) => {
    onChange(event.target.value);
  });

  wrapper.append(text, input);
  return wrapper;
};

const createTextarea = ({ label, value, onChange, placeholder = '' }) => {
  const wrapper = document.createElement('label');
  const text = document.createElement('span');
  text.textContent = label;

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.placeholder = placeholder;
  textarea.addEventListener('input', (event) => {
    onChange(event.target.value);
  });

  wrapper.append(text, textarea);
  return wrapper;
};

const createStatusSelect = ({ value, onChange }) => {
  const wrapper = document.createElement('label');
  const text = document.createElement('span');
  text.textContent = 'Status';

  const select = document.createElement('select');

  statusOptions.forEach((optionValue) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    if (optionValue === value) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', (event) => {
    onChange(event.target.value);
  });

  wrapper.append(text, select);
  return wrapper;
};

const createActionButtons = ({ onMoveUp, onMoveDown, onDelete }) => {
  const actions = document.createElement('div');
  actions.className = 'editor-actions';

  const upButton = document.createElement('button');
  upButton.type = 'button';
  upButton.className = 'btn';
  upButton.textContent = 'Move up';
  upButton.addEventListener('click', onMoveUp);

  const downButton = document.createElement('button');
  downButton.type = 'button';
  downButton.className = 'btn';
  downButton.textContent = 'Move down';
  downButton.addEventListener('click', onMoveDown);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'btn btn-danger';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', onDelete);

  actions.append(upButton, downButton, deleteButton);
  return actions;
};

const renderProjects = () => {
  elements.projectsEditor.innerHTML = '';

  if (state.data.projects.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'No projects yet. Click "Add Project" to create one.';
    elements.projectsEditor.appendChild(empty);
    return;
  }

  state.data.projects.forEach((project, index) => {
    const card = document.createElement('article');
    card.className = 'editor-card';

    const heading = document.createElement('h3');
    heading.textContent = `Project ${index + 1}`;

    card.appendChild(heading);
    card.appendChild(createInput({
      label: 'Title',
      value: project.title,
      placeholder: 'Project title',
      onChange: (newValue) => {
        project.title = newValue;
      }
    }));

    card.appendChild(createTextarea({
      label: 'Summary',
      value: project.summary,
      placeholder: 'Short project summary',
      onChange: (newValue) => {
        project.summary = newValue;
      }
    }));

    card.appendChild(createStatusSelect({
      value: project.status,
      onChange: (newValue) => {
        project.status = newValue;
      }
    }));

    card.appendChild(createInput({
      label: 'Project URL (optional)',
      value: project.url,
      type: 'url',
      placeholder: 'https://example.com/project-details',
      onChange: (newValue) => {
        project.url = newValue;
      }
    }));

    card.appendChild(createActionButtons({
      onMoveUp: () => {
        moveItem(state.data.projects, index, index - 1);
        renderProjects();
      },
      onMoveDown: () => {
        moveItem(state.data.projects, index, index + 1);
        renderProjects();
      },
      onDelete: () => {
        state.data.projects.splice(index, 1);
        renderProjects();
      }
    }));

    elements.projectsEditor.appendChild(card);
  });
};

const renderArticles = () => {
  elements.articlesEditor.innerHTML = '';

  if (state.data.articles.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'No articles yet. Click "Add Article" to create one.';
    elements.articlesEditor.appendChild(empty);
    return;
  }

  state.data.articles.forEach((article, index) => {
    const card = document.createElement('article');
    card.className = 'editor-card';

    const heading = document.createElement('h3');
    heading.textContent = `Article ${index + 1}`;

    card.appendChild(heading);
    card.appendChild(createInput({
      label: 'Type',
      value: article.type,
      placeholder: 'Technical Report, Blog Post, etc.',
      onChange: (newValue) => {
        article.type = newValue;
      }
    }));

    card.appendChild(createInput({
      label: 'Title',
      value: article.title,
      placeholder: 'Article title',
      onChange: (newValue) => {
        article.title = newValue;
      }
    }));

    card.appendChild(createTextarea({
      label: 'Summary',
      value: article.summary,
      placeholder: 'Short article summary',
      onChange: (newValue) => {
        article.summary = newValue;
      }
    }));

    const metaGrid = document.createElement('div');
    metaGrid.className = 'grid-2';

    metaGrid.appendChild(createInput({
      label: 'Meta (left)',
      value: article.metaPrimary,
      placeholder: 'In preparation',
      onChange: (newValue) => {
        article.metaPrimary = newValue;
      }
    }));

    metaGrid.appendChild(createInput({
      label: 'Meta (right)',
      value: article.metaTag,
      placeholder: 'Evaluation Protocol',
      onChange: (newValue) => {
        article.metaTag = newValue;
      }
    }));

    card.appendChild(metaGrid);

    card.appendChild(createInput({
      label: 'Article URL (optional)',
      value: article.url,
      type: 'url',
      placeholder: 'https://example.com/post',
      onChange: (newValue) => {
        article.url = newValue;
      }
    }));

    card.appendChild(createInput({
      label: 'Link label (optional)',
      value: article.linkText,
      placeholder: 'Read article',
      onChange: (newValue) => {
        article.linkText = newValue;
      }
    }));

    card.appendChild(createActionButtons({
      onMoveUp: () => {
        moveItem(state.data.articles, index, index - 1);
        renderArticles();
      },
      onMoveDown: () => {
        moveItem(state.data.articles, index, index + 1);
        renderArticles();
      },
      onDelete: () => {
        state.data.articles.splice(index, 1);
        renderArticles();
      }
    }));

    elements.articlesEditor.appendChild(card);
  });
};

const renderAllEditors = () => {
  renderProjects();
  renderArticles();
};

const loadLocalData = async () => {
  try {
    const response = await fetch(DATA_URL, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Could not fetch ${DATA_URL} (${response.status})`);
    }

    const loadedData = await response.json();
    state.data = normalizeData(loadedData);
    renderAllEditors();
    setStatus('Loaded local content file.', 'success');
  } catch (error) {
    console.error(error);
    setStatus('Could not load local content file. You can still create entries manually.', 'error');
    state.data = normalizeData({});
    renderAllEditors();
  }
};

const encodePath = (path) => path
  .split('/')
  .filter(Boolean)
  .map((part) => encodeURIComponent(part))
  .join('/');

const toBase64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json'
});

const publishToGitHub = async () => {
  const token = normalizeText(elements.tokenInput.value);

  if (!token) {
    setStatus('Add a GitHub token before publishing.', 'error');
    return;
  }

  const settings = getSettings();
  saveSettings();

  const encodedPath = encodePath(settings.path);
  const resourceUrl = `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}/contents/${encodedPath}`;
  const sourceData = normalizeData(state.data);
  const content = `${JSON.stringify(sourceData, null, 2)}\n`;

  setStatus('Publishing to GitHub...', 'info');
  elements.publishButton.disabled = true;

  try {
    let sha;

    const currentResponse = await fetch(`${resourceUrl}?ref=${encodeURIComponent(settings.branch)}`, {
      headers: getAuthHeaders(token)
    });

    if (currentResponse.ok) {
      const currentFile = await currentResponse.json();
      sha = currentFile.sha;
    } else if (currentResponse.status !== 404) {
      const errorText = await currentResponse.text();
      throw new Error(`Could not read current file (${currentResponse.status}): ${errorText}`);
    }

    const payload = {
      message: normalizeText(elements.messageInput.value, 'Update website content via admin dashboard'),
      content: toBase64(content),
      branch: settings.branch
    };

    if (sha) {
      payload.sha = sha;
    }

    const publishResponse = await fetch(resourceUrl, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload)
    });

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      throw new Error(`Publish failed (${publishResponse.status}): ${errorText}`);
    }

    const result = await publishResponse.json();
    const commitUrl = result?.commit?.html_url || '';

    if (commitUrl) {
      setStatus(`Published successfully. Commit: ${commitUrl}`, 'success');
    } else {
      setStatus('Published successfully.', 'success');
    }
  } catch (error) {
    console.error(error);
    setStatus(`Publish failed: ${error.message}`, 'error');
  } finally {
    elements.publishButton.disabled = false;
  }
};

const downloadBackup = () => {
  const cleanData = normalizeData(state.data);
  const content = `${JSON.stringify(cleanData, null, 2)}\n`;
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'site-data.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  setStatus('Downloaded JSON backup.', 'success');
};

const initializeEvents = () => {
  elements.addProjectButton.addEventListener('click', () => {
    state.data.projects.push(createDefaultProject());
    renderProjects();
  });

  elements.addArticleButton.addEventListener('click', () => {
    state.data.articles.push(createDefaultArticle());
    renderArticles();
  });

  elements.reloadButton.addEventListener('click', loadLocalData);
  elements.downloadButton.addEventListener('click', downloadBackup);
  elements.publishButton.addEventListener('click', publishToGitHub);

  [elements.ownerInput, elements.repoInput, elements.branchInput, elements.pathInput].forEach((input) => {
    input.addEventListener('change', saveSettings);
  });
};

const initialize = async () => {
  loadSettings();
  initializeEvents();
  await loadLocalData();
};

initialize();
