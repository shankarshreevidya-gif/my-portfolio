
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import "./PublicPortfolio.css";

const API = "https://my-portfolio-backend-bdq0.onrender.com";

function Minimalist({ data }) {
  return (
    <main className="public-page minimalist">
      <header className="public-header">
        <Link to="/" className="public-brand">CodeFolio.</Link>
        <nav>
          {data.socialLinks?.github && <a href={data.socialLinks.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
          {data.socialLinks?.linkedin && <a href={data.socialLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
          {data.resumeUrl && <a href={data.resumeUrl} target="_blank" rel="noreferrer">Resume ↗</a>}
        </nav>
      </header>

      <section className="public-hero">
        <p className="public-kicker">HELLO, I'M</p>
        <h1>{data.name}</h1>
        <p className="public-bio">{data.bio || "Developer building useful things for the web."}</p>
      </section>

      <section className="public-section">
        <p className="public-kicker">SELECTED WORK</p>
        <h2>Projects I've built.</h2>
        <div className="public-project-grid">
          {data.projects?.map((project, i) => (
            <article className="public-project" key={project._id || i}>
              {project.screenshot && (
                <img src={project.screenshot} alt={`${project.title} preview`} loading="lazy" />
              )}
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="public-tags">
                {(project.techStack || []).map((tech, j) => <span key={j}>{tech}</span>)}
              </div>
              <div className="public-actions">
                {project.repoLink && <a href={project.repoLink} target="_blank" rel="noreferrer">Source code ↗</a>}
                {project.liveLink && <a href={project.liveLink} target="_blank" rel="noreferrer">Live demo ↗</a>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Skills data={data} />
      <PublicFooter data={data} />
    </main>
  );
}

function Cyberpunk({ data }) {
  return (
    <main className="public-page cyberpunk">
      <header className="public-header">
        <Link to="/" className="public-brand">CF//PORTFOLIO</Link>
        <span className="cyber-status">● SYSTEM ONLINE</span>
      </header>

      <section className="public-hero">
        <p className="public-kicker">IDENTITY FOUND // DEVELOPER</p>
        <h1>{data.name}<span className="cyber-cursor">_</span></h1>
        <p className="public-bio">{data.bio || "Building the next digital experience."}</p>
        <div className="public-actions">
          {data.socialLinks?.github && <a href={data.socialLinks.github} target="_blank" rel="noreferrer">[ GITHUB ]</a>}
          {data.socialLinks?.linkedin && <a href={data.socialLinks.linkedin} target="_blank" rel="noreferrer">[ LINKEDIN ]</a>}
          {data.resumeUrl && <a href={data.resumeUrl} target="_blank" rel="noreferrer">[ RESUME ]</a>}
        </div>
      </section>

      <section className="public-section">
        <p className="public-kicker">01 // DEPLOYED PROJECTS</p>
        <h2>Build archive<span className="cyber-cursor">_</span></h2>
        <div className="public-project-grid">
          {data.projects?.map((project, i) => (
            <article className="public-project" key={project._id || i}>
              {project.screenshot && (
                <img src={project.screenshot} alt={`${project.title} preview`} loading="lazy" />
              )}
              <p className="public-kicker">PROJECT_{String(i + 1).padStart(2, "0")}</p>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="public-tags">
                {(project.techStack || []).map((tech, j) => <span key={j}>{tech}</span>)}
              </div>
              <div className="public-actions">
                {project.repoLink && <a href={project.repoLink} target="_blank" rel="noreferrer">[ SOURCE ]</a>}
                {project.liveLink && <a href={project.liveLink} target="_blank" rel="noreferrer">[ LAUNCH ]</a>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Skills data={data} />
      <PublicFooter data={data} />
    </main>
  );
}

function Skills({ data }) {
  return (
    <section className="public-section">
      <p className="public-kicker">CAPABILITIES</p>
      <h2>My tech stack.</h2>
      <div className="public-skills">
        {(data.skills || []).map((skill, i) => (
          <article key={i}>
            <h3>{skill.category}</h3>
            <div className="public-tags">
              {(skill.items || []).map((item, j) => <span key={j}>{item}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PublicFooter({ data }) {
  return (
    <footer className="public-footer">
      <p>Built with CodeFolio.</p>
      {data.socialLinks?.website && (
        <a href={data.socialLinks.website} target="_blank" rel="noreferrer">Personal website ↗</a>
      )}
    </footer>
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
  if (error || !data) return (
    <main className="public-state">
      <h1>Portfolio unavailable</h1>
      <p>{error || "No portfolio data found."}</p>
      <Link to="/">Go to CodeFolio</Link>
    </main>
  );

  const title = `${data.name} | CodeFolio`;
  const description = (data.bio || `Explore ${data.name}'s developer portfolio.`).slice(0, 155);
  const Layout = data.templateId === "cyberpunk" ? Cyberpunk : Minimalist;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>
      <Layout data={data} />
    </>
  );
}
