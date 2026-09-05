import Link from "next/link";

const features = [
  { title: "Fair judging", text: "Server-side judging with isolated execution and resource limits." },
  { title: "Live rankings", text: "See verdicts, scores and leaderboard movement without refreshing." },
  { title: "Contest control", text: "Create problems, test cases, schedules, scoring rules and freezes." },
  { title: "Multi-language", text: "Run C++, Python, Java and JavaScript through language-specific judges." },
  { title: "Built for clubs", text: "Recruitment rounds, workshops, coding contests and inter-college events." },
  { title: "Audit-ready", text: "Keep contest actions, integrity signals and administrative changes traceable." },
];

const steps = [
  ["01", "Create", "Organizers publish a contest and add problems."],
  ["02", "Compete", "Participants register, solve and submit from the Arena."],
  ["03", "Judge", "The secure judge compiles and evaluates each submission."],
  ["04", "Rank", "Scores, penalties and the leaderboard update automatically."],
];

export default function HomePage() {
  return (
    <main>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark">CA</span>
          <span>
            <strong>Coders Arena</strong>
            <small>Coders Club • GPREC</small>
          </span>
        </Link>
        <div className="nav-links">
          <Link href="/contests">Contests</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/login" className="nav-cta">Sign in</Link>
        </div>
      </nav>

      <section className="promo-hero container">
        <div className="hero-copy">
          <div className="announcement"><span /> Built for coding competitions</div>
          <p className="eyebrow">Coders Club • G. Pulla Reddy Engineering College</p>
          <h1>Compete.<br /><span>Build. Prove.</span></h1>
          <p className="hero-lead">
            Coders Arena is a modern online judge for contests, recruitment rounds and
            inter-college coding events — designed for fast competition and fair evaluation.
          </p>
          <div className="hero-actions">
            <Link className="primary-cta" href="/contests">Explore contests <span>→</span></Link>
            <Link className="secondary-cta" href="/login">Join Coders Arena</Link>
          </div>
          <div className="hero-trust">
            <span>⚡ Live judging</span><span>◈ 4 languages</span><span>✓ Contest scoring</span>
          </div>
        </div>
        <div className="hero-panel" aria-label="Arena preview">
          <div className="panel-top"><span className="live-dot" /> LIVE CONTEST <span className="panel-time">02:14:38</span></div>
          <div className="panel-title">Vibe2Build — Coding Challenge</div>
          <div className="mini-stats"><div><b>128</b><span>Participants</span></div><div><b>4</b><span>Problems</span></div><div><b>92</b><span>Submissions</span></div></div>
          <div className="score-list">
            <div><span>01</span><strong>Participant 01</strong><b>400</b></div>
            <div><span>02</span><strong>Participant 02</strong><b>360</b></div>
            <div><span>03</span><strong>Participant 03</strong><b>320</b></div>
            <div className="you"><span>12</span><strong>You</strong><b>240</b></div>
          </div>
          <div className="accepted"><span>✓</span> Submission accepted <small>+100 pts</small></div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats-grid">
          <div><strong>01</strong><span>Contest platform</span></div>
          <div><strong>04</strong><span>Judge languages</span></div>
          <div><strong>24/7</strong><span>Practice ready</span></div>
          <div><strong>∞</strong><span>Ideas to build</span></div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading"><div><p className="eyebrow">WHY CODERS ARENA</p><h2>Everything a coding contest needs.</h2></div><p>From the first registration to the final ranking, every part of the contest workflow lives in one place.</p></div>
        <div className="feature-grid">{features.map((f, i) => <article className="feature-card" key={f.title}><span className="feature-number">0{i + 1}</span><h3>{f.title}</h3><p>{f.text}</p></article>)}</div>
      </section>

      <section className="dark-section">
        <div className="container section">
          <div className="section-heading dark-heading"><div><p className="eyebrow">HOW IT WORKS</p><h2>From problem to leaderboard.</h2></div><p>A simple experience for participants. Powerful controls for organizers.</p></div>
          <div className="steps-grid">{steps.map(([num, title, text]) => <div className="step" key={num}><span>{num}</span><h3>{title}</h3><p>{text}</p></div>)}</div>
        </div>
      </section>

      <section className="section container contest-cta">
        <div><p className="eyebrow">READY TO COMPETE?</p><h2>Turn your next coding event into an Arena.</h2><p>Run recruitment rounds, club contests, workshops and inter-college challenges with a platform made for competitive programming.</p></div>
        <div className="cta-actions"><Link className="primary-cta" href="/contests">View contests <span>→</span></Link><Link className="secondary-cta" href="/login">Sign in</Link></div>
      </section>

      <footer className="site-footer"><div className="container footer-inner"><div><strong>Coders Arena</strong><p>Powered by Coders Club • GPREC</p></div><div><Link href="/contests">Contests</Link><Link href="/login">Sign in</Link></div></div></footer>
    </main>
  );
}
