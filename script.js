const experience = [
  {
    role: 'Software Engineer (Co-Founder)',
    org: 'Maedo',
    dates: 'Aug 2025 – Present',
    bullets: [
      'Building a unified platform for small businesses to cross-list and manage products across eBay, Etsy, and more.',
      'Developed the full-stack app with Next.js, TypeScript, Tailwind, Clerk auth, and shadcn/ui.',
      'Designed backend with NestJS, Prisma, PostgreSQL (Neon/Supabase) plus Redis + BullMQ jobs for syncs and updates.'
    ]
  },
  {
    role: 'Software Engineering Intern',
    org: 'HackDuke',
    dates: 'Aug 2025 – Present',
    bullets: [
      'Building and deploying the official HackDuke website using React, PostgreSQL, and Python.',
      'Supporting registration and logistics for 1,000+ participants with reliable infra.'
    ]
  },
  {
    role: 'Co-Founder',
    org: 'Cottage Industries of CFL',
    dates: '2020 – Aug 2025',
    bullets: [
      'Scaled e-commerce business to $1M+ annual sales at 25% ROI via automation of sourcing, checkout, and intake.',
      'Maintained Top Rated Seller status and 100% positive feedback across marketplaces.'
    ]
  }
];

const projects = [
  {
    title: 'Crypto Futures Framework',
    stage: 'In Progress',
    blurb: 'Async research and execution framework for high-frequency crypto futures strategies.',
    tech: ['Python', 'Asyncio', 'Pandas', 'NumPy'],
    tags: ['Trading', 'Data'],
    highlights: [
      'Modular OHLCV loader cut latency by 30% and backtest runtime by 25%.',
      'Risk-parity optimizer and transaction-cost modeling lowered max drawdown by 15%.'
    ]
  },
  {
    title: 'Prediction Market Arbitrage Bot',
    stage: 'In Progress',
    blurb: 'Containerized news-arb system for Polymarket using WebSockets + REST.',
    tech: ['Python', 'WebSockets', 'REST', 'OpenAI API'],
    tags: ['Trading', 'Systems'],
    highlights: [
      'Event handlers, order sizing, and execution tuned for low latency.',
      'Async pipelines for reliability while ingesting real-time market data.'
    ]
  },
  {
    title: 'Multi-Factor Equity Backtester',
    stage: 'In Progress',
    blurb: 'Vectorized engine to test equity alpha factors on U.S. markets.',
    tech: ['Python', 'Pandas', 'NumPy', 'yfinance'],
    tags: ['Trading', 'Data'],
    highlights: [
      'Integrated four modular strategies: VPMO, Gap Fade, Multi-TF Trend, Composite EMA.',
      '80% runtime reduction via vectorized pipelines; outputs P&L, Sharpe, drawdown.'
    ]
  }
];

const skills = [
  { group: 'Languages', items: ['Python', 'C++', 'Java', 'JavaScript', 'SQL', 'HTML/CSS'] },
  { group: 'Frameworks', items: ['React', 'Next.js', 'Node.js', 'NestJS', 'Tailwind', 'shadcn/ui'] },
  { group: 'Data & Infra', items: ['PostgreSQL (Neon/Supabase)', 'Prisma', 'Redis', 'BullMQ', 'Docker'] },
  { group: 'Analytics', items: ['Pandas', 'NumPy', 'Asyncio', 'Backtesting', 'Risk Parity'] },
];

const leadership = [
  {
    title: 'Coding Club President',
    detail: 'Led weekly competitive programming sessions; boosted problem-solving speed for the team.'
  },
  {
    title: 'Code Quest Top-10 Finalist (2024)',
    detail: 'National recognition for algorithmic programming performance.'
  },
  {
    title: 'Executive Treasurer, Student Government',
    detail: 'Managed $10K+ budget with transparent reporting and allocations.'
  },
  {
    title: 'Vice President, National Honor Society',
    detail: 'Organized and led 300+ service hours across the chapter.'
  }
];

const filters = ['All', 'Trading', 'Systems', 'Data'];

function renderExperience() {
  const container = document.getElementById('experience-list');
  container.innerHTML = experience.map(item => `
    <div class="timeline-item">
      <div>
        <p class="label">${item.dates}</p>
        <p class="title">${item.role}</p>
        <p class="org">${item.org}</p>
      </div>
      <div>
        <ul>
          ${item.bullets.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');
}

function renderProjects(active = 'All') {
  const container = document.getElementById('projects-grid');
  const filtered = active === 'All' ? projects : projects.filter(p => p.tags.includes(active));
  container.innerHTML = filtered.map(p => `
    <article class="project">
      <span class="pill">${p.stage}</span>
      <h3>${p.title}</h3>
      <p>${p.blurb}</p>
      <div class="tech">${p.tech.map(t => `<span>${t}</span>`).join('')}</div>
      <ul>
        ${p.highlights.map(h => `<li>${h}</li>`).join('')}
      </ul>
    </article>
  `).join('');
}

function renderSkills() {
  const container = document.getElementById('skills-grid');
  container.innerHTML = skills.map(s => `
    <div class="skill-card">
      <h4>${s.group}</h4>
      <div class="chip-group">
        ${s.items.map(i => `<span class="chip">${i}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function renderLeadership() {
  const container = document.getElementById('leadership-grid');
  container.innerHTML = leadership.map(l => `
    <div class="project">
      <h3>${l.title}</h3>
      <p>${l.detail}</p>
    </div>
  `).join('');
}

function renderFilters() {
  const container = document.getElementById('project-filters');
  container.innerHTML = filters.map(f => `<button class="filter ${f === 'All' ? 'active' : ''}" data-filter="${f}">${f}</button>`).join('');
  container.addEventListener('click', e => {
    if (e.target.matches('.filter')) {
      document.querySelectorAll('.filter').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      renderProjects(e.target.dataset.filter);
    }
  });
}

function setupProgress() {
  const bar = document.querySelector('.progress');
  const onScroll = () => {
    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const percent = Math.min(100, (scrollTop / height) * 100);
    bar.style.width = `${percent}%`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

document.addEventListener('DOMContentLoaded', () => {
  renderExperience();
  renderProjects();
  renderSkills();
  renderLeadership();
  renderFilters();
  setupProgress();
});
