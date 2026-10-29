
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import "./PublicPortfolio.css";

const API = "https://my-portfolio-backend-bdq0.onrender.com";

function ContactForm({ username }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSending(true);
    setStatus("");

    try {
      const response = await axios.post(
        `${API}/api/users/${encodeURIComponent(username)}/contact`,
        form
      );

      setStatus(response.data?.message || "Message sent successfully!");
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      setStatus(
        error.response?.data?.message ||
        "Unable to send your message. Please try again later."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="public-section contact-section" id="contact">
      <div className="contact-intro">
        <p className="public-kicker">LET'S CONNECT</p>
        <h2>Have a project in mind?</h2>
        <p>
          I'm open to discussing projects, creative ideas,
          and opportunities to learn and grow.
        </p>
        {username && (
          <p className="contact-handle">
            <span>↗</span> {username}
          </p>
        )}
      </div>

      <form className="public-contact-form" onSubmit={handleSubmit}>
        <div className="contact-fields">
          <input
            aria-label="Your name"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={80}
            required
          />
          <input
            aria-label="Your email"
            type="email"
            name="email"
            placeholder="Your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={254}
            required
          />
        </div>

        <textarea
          aria-label="Your message"
          name="message"
          placeholder="Tell me about your idea..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          maxLength={3000}
          rows={5}
          required
        />

        <button className="contact-submit" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send Message ↗"}
        </button>

        {status && <p className="contact-status" role="status">{status}</p>}
      </form>
    </section>
  );
}

function Skills({ data }) {
  const icons = ["⌘", "▤", "⚙", "◇"];

  return (
    <section className="public-section skills-section" id="skills">
      <p className="public-kicker">WHAT I WORK WITH</p>
      <h2>Skills &amp; technologies.</h2>

      <div className="public-skills">
        {(data.skills || []).map((skill, i) => (
          <article className="skill-card" key={i}>
            <div className="skill-icon">{icons[i % icons.length]}</div>
            <div>
              <h3>{skill.category}</h3>
              <div className="public-tags">
                {(skill.items || []).map((item, j) => (
                  <span key={j}>{item}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Projects({ data }) {
  return (
    <section className="public-section projects-section" id="projects">
      <div className="section-heading-row">
        <div>
          <p className="public-kicker">FEATURED PROJECTS</p>
          <h2>Some things I've built.</h2>
        </div>
        <span className="section-note">Selected work ↗</span>
      </div>

      {data.projects?.length ? (
        <div className="public-project-grid">
          {data.projects.map((project, i) => (
            <article className="public-project" key={project._id || i}>
              <div className="project-preview">
                {project.screenshot ? (
                  <img
                    src={project.screenshot}
                    alt={`${project.title} preview`}
                    loading="lazy"
                  />
                ) : (
                  <div className={`project-placeholder placeholder-${i % 3}`}>
                    <span>PROJECT / {String(i + 1).padStart(2, "0")}</span>
                    <strong>{project.title}</strong>
                    <span className="placeholder-mark">↗</span>
                  </div>
                )}
              </div>

              <div className="project-content">
                <h3>{project.title}</h3>
                <p>{project.description}</p>

                <div className="public-tags">
                  {(project.techStack || []).map((tech, j) => (
                    <span key={j}>{tech}</span>
                  ))}
                </div>

                <div className="public-actions">
                  {project.repoLink && (
                    <a href={project.repoLink} target="_blank" rel="noreferrer">
                      Source code ↗
                    </a>
                  )}
                  {project.liveLink && (
                    <a href={project.liveLink} target="_blank" rel="noreferrer">
                      Live demo ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-projects">
          Projects will appear here once they are added to the portfolio.
        </p>
      )}
    </section>
  );
}

function PublicFooter({ data }) {
  return (
    <footer className="public-footer">
      <p>© {new Date().getFullYear()} {data.name}. All rights reserved.</p>
      <p>Built with <span className="footer-heart">♥</span> and CodeFolio.</p>
      <a href="#top" className="back-to-top" aria-label="Back to top">↑</a>
    </footer>
  );
}

function Minimalist({ data, username }) {
  return (
    <main className="public-page minimalist" id="top">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <span className="brand-symbol">{"</>"}</span> CodeFolio
        </Link>

        <nav className="public-nav">
          <a className="nav-active" href="#top">Home</a>
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Let's Connect</a>
        </nav>

        <div className="header-socials">
          {data.socialLinks?.github && (
            <a href={data.socialLinks.github} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          )}
          {data.socialLinks?.linkedin && (
            <a href={data.socialLinks.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
          )}
          {data.resumeUrl && (
  <a
    href={data.resumeUrl}
    target="_blank"
    rel="noreferrer"
  >
    Resume ↗
  </a>
)}

        </div>
      </header>

      <section className="public-hero">
        <div className="hero-copy">
          <span className="hero-pill">HELLO, I'M</span>
          <h1>{data.name}</h1>
          <p className="hero-role">WEB DEVELOPER &amp; BCA STUDENT</p>
          <p className="public-bio">
            {data.bio ||
              "I enjoy creating thoughtful digital experiences and building useful things for the web."}
          </p>

          <div className="hero-actions">
            <a href="#projects" className="primary-button">Explore My Work ↗</a>
            {data.resumeUrl && (
              <a
                href={data.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="secondary-button"
              >
                View Resume ↗
              </a>
            )}
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-glow" />
          <div className="hero-monogram">
            <span className="monogram-code">{"< / >"}</span>
            <span className="monogram-name">
              {data.name.split(" ").map((word) => word[0]).join("").slice(0, 3)}
            </span>
            <span className="monogram-caption">CREATIVE DEVELOPER</span>
          </div>
          <span className="orbit-dot dot-one" />
          <span className="orbit-dot dot-two" />
        </div>
      </section>

      <section className="public-section about-section" id="about">
        <div className="about-copy">
          <p className="public-kicker">A LITTLE ABOUT ME</p>
          <h2>Building ideas into digital experiences.</h2>
          <p>
            {data.bio ||
              "I'm a BCA student interested in web development, creative problem-solving, and learning new technologies."}
          </p>
          <a href="#contact" className="text-link">Let's work together ↗</a>
        </div>

        <div className="about-details">
          <article>
            <span className="detail-icon">⌘</span>
            <div>
              <h3>Frontend Development</h3>
              <p>Creating responsive and intuitive web interfaces.</p>
            </div>
          </article>
          <article>
            <span className="detail-icon">◇</span>
            <div>
              <h3>Backend &amp; Databases</h3>
              <p>Learning APIs, server-side development, and data storage.</p>
            </div>
          </article>
          <article>
            <span className="detail-icon">✳</span>
            <div>
              <h3>Always Learning</h3>
              <p>Exploring new tools and improving through projects.</p>
            </div>
          </article>
        </div>
      </section>

      <Projects data={data} />
      <Skills data={data} />
      <ContactForm username={username} />
      <PublicFooter data={data} />
    </main>
  );
}

function Cyberpunk({ data, username }) {
  return (
    <main className="public-page cyberpunk" id="top">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <span className="brand-symbol">{"</>"}</span> CodeFolio_
        </Link>
        <nav className="public-nav">
          <a href="#top">Home</a>
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="public-hero">
        <div className="hero-copy">
          <span className="hero-pill">IDENTITY FOUND // DEVELOPER</span>
          <h1>{data.name}<span className="cyber-cursor">_</span></h1>
          <p className="hero-role">BUILDING FOR THE DIGITAL WORLD</p>
          <p className="public-bio">
            {data.bio || "Exploring ideas and building digital experiences."}
          </p>
          <div className="hero-actions">
            <a href="#projects" className="primary-button">View Projects ↗</a>
            <a href="#contact" className="secondary-button">Connect</a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-glow" />
          <div className="hero-monogram">
            <span className="monogram-code">{"< / >"}</span>
            <span className="monogram-name">
              {data.name.split(" ").map((word) => word[0]).join("").slice(0, 3)}
            </span>
            <span className="monogram-caption">SYSTEM ONLINE</span>
          </div>
        </div>
      </section>

      <section className="public-section about-section" id="about">
        <div className="about-copy">
          <p className="public-kicker">01 // PROFILE</p>
          <h2>Digital ideas, built with purpose.</h2>
          <p>{data.bio || "A developer in progress, always learning."}</p>
        </div>
        <div className="about-details">
          <article><span className="detail-icon">⌘</span><div><h3>Frontend</h3><p>Interfaces and responsive design.</p></div></article>
          <article><span className="detail-icon">◇</span><div><h3>Backend</h3><p>APIs and database fundamentals.</p></div></article>
          <article><span className="detail-icon">✳</span><div><h3>Learning</h3><p>New technologies and problem-solving.</p></div></article>
        </div>
      </section>

      <Projects data={data} />
      <Skills data={data} />
      <ContactForm username={username} />
      <PublicFooter data={data} />
    </main>
  );
}

export default function PublicPortfolio() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    axios.get(`${API}/api/users/${encodeURIComponent(username)}`)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.status === 404
              ? "This portfolio doesn't exist yet."
              : "Couldn't load this portfolio. Please try again."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [username]);

  if (loading) return <main className="public-state">Loading portfolio...</main>;

  if (error || !data) {
    return (
      <main className="public-state">
        <h1>Portfolio unavailable</h1>
        <p>{error || "No portfolio data found."}</p>
        <Link to="/">Go to CodeFolio</Link>
      </main>
    );
  }

  const title = `${data.name} | CodeFolio`;
  const description = (
    data.bio || `Explore ${data.name}'s developer portfolio.`
  ).slice(0, 155);
  const Layout = data.templateId === "cyberpunk" ? Cyberpunk : Minimalist;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>
      <Layout data={data} username={username} />
    </>
  );
}
