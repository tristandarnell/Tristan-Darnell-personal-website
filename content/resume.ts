export const profile = {
  name: "Tristan Darnell",
  location: "Orlando, FL",
  email: "tristdarnell@gmail.com",
  tagline: "Software engineering * Duke CS/Math '28",
  blurb:
    "Duke CS/Math student building production web applications, backend infrastructure, and quantitative research tooling.",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/tristan-darnell-229412354/" },
    { label: "GitHub", href: "https://github.com/tristandarnell" }
  ]
};

export const education = {
  school: "Duke University",
  degree: "B.S. in Computer Science and Mathematics",
  graduation: "Expected May 2029",
  gpa: "4.0/4.0",
  coursework: [
    "Data Structures and Algorithms (CS 201)",
    "Introduction to Computer Systems (CS 210)",
    "Linear Algebra (MATH 221)",
    "Multivariable Calculus (MATH 219)"
  ],
  involvement: ["Catalyst", "HackDuke", "Duke Quant Finance Club"]
};

type ExperienceItem = {
  role: string;
  org: string;
  orgUrl?: string;
  dates: string;
  bullets: string[];
};

export const experience: ExperienceItem[] = [
  {
    role: "Incoming Software Engineering Intern",
    org: "Lockheed Martin",
    orgUrl: "https://www.lockheedmartin.com/en-us/who-we-are/business-areas/space.html",
    dates: "Summer 2026 (Incoming)",
    bullets: [
      "Joining Lockheed Martin as a software engineering intern for Summer 2026.",
      "Expected focus on production-grade systems development, testing, and reliability in mission-critical environments."
    ]
  },
  {
    role: "Software Engineer (Co-Founder)",
    org: "Maedo",
    dates: "Aug 2025 – Present",
    bullets: [
      "Building a unified platform for small businesses to cross-list and manage products across eBay, Etsy, and more.",
      "Developed the full-stack app with Next.js, TypeScript, Tailwind, Clerk auth, and shadcn/ui.",
      "Designed backend with NestJS, Prisma, PostgreSQL (Neon/Supabase) plus Redis + BullMQ jobs for syncs and updates."
    ]
  },
  {
    role: "Software Engineering Intern",
    org: "HackDuke",
    orgUrl: "https://hackduke.org",
    dates: "Aug 2025 – Present",
    bullets: [
      "Building and deploying the official HackDuke website using React, PostgreSQL, and Python.",
      "Supporting registration and logistics for 1,000+ participants with reliable infra."
    ]
  },
  {
    role: "Co-Founder",
    org: "Cottage Industries of CFL",
    dates: "2020 – Aug 2025",
    bullets: [
      "Scaled e-commerce business to $1M+ annual sales at 25% ROI via automation of sourcing, checkout, and intake.",
      "Maintained Top Rated Seller status and 100% positive feedback across marketplaces."
    ]
  }
];

type ProjectItem = {
  title: string;
  stage: string;
  blurb: string;
  problemStatement: string;
  resultStatement: string;
  proofUrl?: string;
  proofLabel?: string;
  repoUrl?: string;
  image: string;
  tech: string[];
  tags: string[];
  highlights: string[];
};

export const projects: ProjectItem[] = [
  {
    title: "Crypto Futures Framework",
    stage: "Active Research",
    blurb: "Async research and execution framework for high-frequency crypto futures strategies.",
    problemStatement: "Built to speed up strategy iteration when crypto data ingestion and backtests become the bottleneck.",
    resultStatement:
      "Reduced OHLCV load latency by 30% and backtest iteration time by 25%, with max drawdown lowered by 15% after risk-model updates.",
    proofUrl: "https://github.com/tristandarnell/Crypto-Trend-Engine",
    proofLabel: "View write-up/code",
    repoUrl: "https://github.com/tristandarnell/Crypto-Trend-Engine",
    image: "/images/project-crypto.svg",
    tech: ["Python", "Asyncio", "Pandas", "NumPy"],
    tags: ["Trading", "Data"],
    highlights: [
      "Modular OHLCV loader cut latency by 30% and backtest runtime by 25%.",
      "Risk-parity optimizer and transaction-cost modeling lowered max drawdown by 15%."
    ]
  },
  {
    title: "Prediction Market Arbitrage Bot",
    stage: "Prototype",
    blurb: "Containerized news-arb system for Polymarket using WebSockets + REST.",
    problemStatement:
      "Built to catch short-lived pricing inefficiencies in prediction markets with low-latency signal ingestion and execution.",
    resultStatement:
      "Shipped 3 core execution modules (event handler, sizing, and order routing) and integrated 2 live feed types (WebSocket + REST) in one async pipeline.",
    image: "/images/project-arbitrage.svg",
    tech: ["Python", "WebSockets", "REST", "OpenAI API"],
    tags: ["Trading", "Systems"],
    highlights: [
      "Event handlers, order sizing, and execution tuned for low latency.",
      "Async pipelines for reliability while ingesting real-time market data."
    ]
  },
  {
    title: "Multi-Factor Equity Backtester",
    stage: "Built & Iterating",
    blurb: "Vectorized engine to test equity alpha factors on U.S. markets.",
    problemStatement:
      "Built to evaluate multiple equity factor ideas quickly with consistent risk and performance reporting across strategies.",
    resultStatement:
      "Cut runtime by 80% with vectorized pipelines and benchmarked 4 modular strategies in one framework with standardized Sharpe and drawdown outputs.",
    proofUrl: "https://github.com/tristandarnell/Tradfi-Trend-Strat",
    proofLabel: "View write-up/code",
    repoUrl: "https://github.com/tristandarnell/Tradfi-Trend-Strat",
    image: "/images/project-equity.svg",
    tech: ["Python", "Pandas", "NumPy", "yfinance"],
    tags: ["Trading", "Data"],
    highlights: [
      "Integrated four modular strategies: VPMO, Gap Fade, Multi-TF Trend, Composite EMA.",
      "80% runtime reduction via vectorized pipelines; outputs P&L, Sharpe, drawdown."
    ]
  }
];

export const media = {
  spotifyEmbedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator",
  spotifyLink: "https://open.spotify.com/",
  aryaImage: "/images/aryastark.jpg",
  aryaFallback: "/images/arya-placeholder.svg",
  omarImage: "/images/omarlittle.jpg",
  omarFallback: "/images/omar-placeholder.svg",
  personalPhotos: [
    { src: "/images/IMG_4188.jpg", alt: "Tristan outdoors at sunset" },
    { src: "/images/DSC04360.jpeg", alt: "Tristan portrait photo" },
    { src: "/images/IMG_0106.jpeg", alt: "Tristan candid photo" },
    { src: "/images/IMG_4278.JPG", alt: "Tristan personal photo" }
  ],
  favoriteShows: ["Game of Thrones", "The Wire"],
  favoriteBooks: [
    { title: "Catch-22", cover: "/images/Catch%2022.jpg" },
    { title: "The Big Short", cover: "/images/The%20Big%20Short.jpg" },
    { title: "Ender's Shadow", cover: "/images/Enders%20shadow.jpg" }
  ],
  favoritePodcasts: [{ title: "Flirting with Models", cover: "/images/Flirting%20with%20models.png" }],
  interests: ["Fishing at sunset", "Music while coding", "Building side projects", "Competitive problem solving"]
};

export const personality = [
  {
    title: "Builder Mindset",
    detail: "I like taking projects from concept to production and owning the full delivery path."
  },
  {
    title: "Competitive Problem Solving",
    detail: "Weekly algorithm practice and mentoring through coding club leadership."
  },
  {
    title: "Focused Deep Work",
    detail: "Music-driven workflow for long implementation and debugging sessions."
  }
];

export const skills = [
  { group: "Languages", items: ["Python", "C++", "Java", "JavaScript", "SQL", "HTML/CSS"] },
  { group: "Frameworks", items: ["React", "Next.js", "Node.js", "NestJS", "Tailwind", "shadcn/ui"] },
  { group: "Data & Infra", items: ["PostgreSQL (Neon/Supabase)", "Prisma", "Redis", "BullMQ", "Docker"] },
  { group: "Analytics", items: ["Pandas", "NumPy", "Asyncio", "Backtesting", "Risk Parity"] }
];

export const leadership = [
  {
    title: "Freeport Markets Crypto Pitch — 2nd Place",
    detail: "Placed second in the Freeport Markets crypto pitch competition."
  },
  {
    title: "Coding Club President",
    detail: "Led weekly competitive programming sessions; boosted problem-solving speed for the team."
  },
  {
    title: "Code Quest Top-10 Finalist (2024)",
    detail: "National recognition for algorithmic programming performance."
  },
  {
    title: "Executive Treasurer, Student Government",
    detail: "Managed $10K+ budget with transparent reporting and allocations."
  },
  {
    title: "Vice President, National Honor Society",
    detail: "Organized and led 300+ service hours across the chapter."
  }
];
