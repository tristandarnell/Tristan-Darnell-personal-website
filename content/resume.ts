export const profile = {
  name: "Tristan Darnell",
  location: "Orlando, FL",
  email: "tristdarnell@gmail.com",
  tagline: "Software engineering · Duke CS/Math '29",
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

export const experience = [
  {
    role: "Incoming Software Engineering Intern",
    org: "Lockheed Martin",
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

export const projects = [
  {
    title: "Crypto Futures Framework",
    stage: "In Progress",
    blurb: "Async research and execution framework for high-frequency crypto futures strategies.",
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
    stage: "In Progress",
    blurb: "Containerized news-arb system for Polymarket using WebSockets + REST.",
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
    stage: "In Progress",
    blurb: "Vectorized engine to test equity alpha factors on U.S. markets.",
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
  aryaImage: "/images/images-2.jpeg",
  aryaFallback: "/images/arya-placeholder.svg",
  omarImage: "/images/omar-the-wire.jpg.webp",
  omarFallback: "/images/omar-placeholder.svg",
  personalPhotos: [
    { src: "/images/IMG_4188.jpg", alt: "Tristan outdoors at sunset" },
    { src: "/images/DSC04360.jpeg", alt: "Tristan portrait photo" },
    { src: "/images/IMG_0106.jpeg", alt: "Tristan candid photo" },
    { src: "/images/IMG_4278.JPG", alt: "Tristan personal photo" }
  ],
  favoriteShows: ["Game of Thrones", "The Wire"],
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
