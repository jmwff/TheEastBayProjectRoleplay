// Application data — edit to match your server's actual open applications.
const deptData = {
  civilian: {
    title: 'Civilian Recruit Application',
    sub: 'Looking to become a civilian and start a new life? Tell us about it.',
    positions: ['Civilian', 'Business Owner (existing business)', 'Independent Contractor'],
    why: 'Why do you want to join as a civilian?',
    scenario: 'Describe an everyday scene involving your character that has nothing to do with law enforcement or emergency services.'
  },
  standard: {
    title: 'Standard Recruit Application',
    sub: 'For Firefighter/EMT and Dispatcher roles.',
    positions: ['Firefighter/EMT Recruit', 'Dispatcher'],
    why: 'Why this department?',
    scenario: 'You respond to a multi-vehicle collision with three patients of varying severity. Explain how you triage, or how you would dispatch units to the scene.'
  },
  leo: {
    title: 'Law Enforcement Officer Recruit Application',
    sub: 'Law Enforcement Applications are currently OPENED.',
    positions: ['Police Cadet', 'Patrol Officer', 'State Trooper'],
    why: 'Why do you want to become a law enforcement officer?',
    scenario: 'A driver refuses to pull over during a routine stop and starts driving erratically. Walk us through your response, step by step.'
  },
  developer: {
    title: 'Developer Application',
    sub: 'For EUP/model, livery, vehicle, and script development.',
    positions: ['EUP / Texture Artist', 'Vehicle Modeler', 'Scripter'],
    why: "What are you interested in developing for the server?",
    scenario: 'Briefly describe a past project (in FiveM or elsewhere) that shows your skill level in this area, and link to it if possible.'
  },
  media: {
    title: 'Media Application',
    sub: 'For YouTube, Twitch, and other content creation.',
    positions: ['YouTube Creator', 'Twitch Streamer', 'Highlight Editor'],
    why: 'Why do you want to join the media department?',
    scenario: 'Link an example of past content you\'ve made (any platform) and tell us what audience you typically reach.'
  }
};

const opts = document.querySelectorAll('.apply-opt');
const formTitle = document.getElementById('formTitle');
const formSub = document.getElementById('formSub');
const positionSelect = document.getElementById('fPosition');
const whyLabel = document.getElementById('whyLabel');
const scenarioLabel = document.getElementById('scenarioLabel');
const scenarioField = document.getElementById('fScenario');
const applyForm = document.getElementById('applyForm');
const formStatus = document.getElementById('formStatus');

let currentDept = 'civilian';

function renderDept(key) {
  currentDept = key;
  const d = deptData[key];
  formTitle.textContent = d.title;
  formSub.textContent = d.sub;
  positionSelect.innerHTML = d.positions.map(p => `<option>${p}</option>`).join('');
  whyLabel.textContent = d.why;
  scenarioLabel.textContent = 'Scenario response';
  scenarioField.placeholder = d.scenario;
  hideStatus();
}

opts.forEach(btn => {
  btn.addEventListener('click', () => {
    opts.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderDept(btn.dataset.dept);
  });
});

// Support ?dept=leo style deep links from the applications list page
const params = new URLSearchParams(window.location.search);
const initialDept = params.get('dept') && deptData[params.get('dept')] ? params.get('dept') : 'civilian';
opts.forEach(b => b.classList.toggle('active', b.dataset.dept === initialDept));
renderDept(initialDept);

// If the user is logged in via Discord, prefill their username.
function prefillDiscordUsername() {
  if (window.WRP_DISCORD_USER) {
    const discordField = document.getElementById('fDiscord');
    if (discordField && !discordField.value) {
      discordField.value = window.WRP_DISCORD_USER.username;
    }
  }
}
prefillDiscordUsername();
// auth.js may still be fetching the user when this script runs; check again shortly after.
setTimeout(prefillDiscordUsername, 800);

function showStatus(message, type) {
  formStatus.textContent = message;
  formStatus.className = `form-status show ${type}`;
}
function hideStatus() {
  formStatus.className = 'form-status';
}

applyForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const webhookUrl =
    SITE_CONFIG.departmentWebhooks[currentDept] || SITE_CONFIG.defaultWebhookUrl;

  if (!webhookUrl || webhookUrl.includes('PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE')) {
    showStatus(
      "This form isn't connected to Discord yet. Add your webhook URL in js/config.js.",
      'error'
    );
    return;
  }

  const submitBtn = applyForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  const dept = deptData[currentDept];
  const name = document.getElementById('fName').value.trim();
  const discordName = document.getElementById('fDiscord').value.trim();
  const age = document.getElementById('fAge').value.trim();
  const hours = document.getElementById('fHours').value.trim();
  const position = positionSelect.value;
  const why = document.getElementById('fWhy').value.trim();
  const scenario = scenarioField.value.trim();

  const payload = {
    embeds: [
      {
        title: `New Application — ${dept.title.replace(' Application', '')}`,
        color: 14713389,
        fields: [
          { name: 'Character Name', value: name || '—', inline: true },
          { name: 'Discord', value: discordName || '—', inline: true },
          { name: 'Age', value: age || '—', inline: true },
          { name: 'Hours on Server', value: hours || '—', inline: true },
          { name: 'Position', value: position || '—', inline: true },
          { name: dept.why, value: why || '—' },
          { name: 'Scenario Response', value: scenario || '—' }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 204) {
      showStatus("Application submitted! You'll hear back over Discord DM.", 'success');
      applyForm.reset();
      renderDept(currentDept);
    } else {
      showStatus(`Something went wrong (status ${res.status}). Try again in a moment.`, 'error');
    }
  } catch (err) {
    showStatus('Could not reach Discord. Check your internet connection and try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});
