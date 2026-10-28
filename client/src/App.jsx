
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";

const skills = ["C", "HTML", "CSS", "JavaScript", "MySQL", "React"];

const projects = [
  {
    number: "01",
    name: "StudyHub",
    type: "EDUCATION PLATFORM",
    description:
      "A student-focused platform for accessing study notes, learning resources and quizzes.",
    tech: ["HTML", "CSS", "JavaScript"],
  },
  {
    number: "02",
    name: "Grand Line Gazette",
    type: "ANIME WEB EXPERIENCE",
    description:
      "An anime-inspired website featuring characters, series, movies and interactive experiences.",
    tech: ["HTML", "CSS", "JavaScript"],
  },
];

function App() {
  const [apiMessage, setApiMessage] = useState("");
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    axios
      .get("https://my-portfolio-backend-bdq0.onrender.com/api/test")
      .then((response) => {
        setApiMessage(response.data.message);
        setApiError(false);
      })
      .catch((error) => {
        console.error("Backend connection failed:", error.message);
        setApiError(true);
      });
  }, []);

  return (
    <div className="portfolio">
      <header className="navbar">
        <a className="brand" href="#home">
          Shree Vidya<span>.</span>
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#education">Education</a>
          <a href="#contact" className="nav-contact">Contact ↗</a>
        </nav>
      </header>

      <main>
        <section className="hero section-width" id="home">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              AVAILABLE FOR LEARNING & OPPORTUNITIES
            </p>

            <h1>
              Building ideas
              <br />
              into <span>digital reality.</span>
            </h1>

            <p className="hero-description">
              Hey, I'm Shree Vidya — a BCA student and aspiring
              developer passionate about building thoughtful,
              useful and engaging digital experiences.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="#projects">
                Explore my work ↗
              </a>
              <a className="button button-secondary" href="#contact">
                Let's connect
              </a>
            </div>

            <p className="location">⌖ &nbsp; Mysuru, India</p>

            {apiMessage && (
              <p className="body-copy" role="status">
                ✓ {apiMessage}
              </p>
            )}

            {apiError && (
              <p className="body-copy" role="status">
                Backend connection is unavailable. Please check
                that your server is running.
              </p>
            )}
          </div>

          <div className="hero-card">
            <div className="code-window">
              <div className="window-dots">
                <i />
                <i />
                <i />
              </div>

              <p className="code-muted">{"// a little about me"}</p>
              <p>
                <span className="code-purple">const</span> developer = {"{"}
              </p>
              <p className="code-indent">
                name: <span className="code-green">"Shree Vidya"</span>,
              </p>
              <p className="code-indent">
                degree: <span className="code-green">"BCA"</span>,
              </p>
              <p className="code-indent">
                focus: <span className="code-green">"Web Development"</span>,
              </p>
              <p className="code-indent">
                mindset: <span className="code-green">"Always learning"</span>
              </p>
              <p>{"};"}</p>

              <div className="code-footer">
                <span />
                Open to new possibilities
              </div>
            </div>

            <div className="floating-tag">✳ &nbsp; Curious by nature</div>
          </div>
        </section>

        <section className="section-width content-section" id="about">
          <p className="eyebrow">01 — ABOUT</p>
          <h2>A little about <span>me.</span></h2>

          <div className="about-grid">
            <p className="section-lead">
              I'm a second-year BCA student at JSS Science and
              Technology University, Mysuru, exploring the world
              of software development one project at a time.
            </p>

            <p className="body-copy">
              I enjoy turning ideas into working projects, learning
              new technologies and improving my problem-solving
              skills. I'm building my foundation in programming
              and web development while gaining practical project
              experience.
            </p>
          </div>
        </section>

        <section className="section-width content-section" id="skills">
          <p className="eyebrow">02 — TOOLKIT</p>
          <h2>Technologies I <span>work with.</span></h2>

          <div className="skill-list">
            {skills.map((skill, index) => (
              <div className="skill-card" key={skill}>
                <span className="skill-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{skill}</span>
                <span className="skill-arrow">↗</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section-width content-section" id="experience">
          <p className="eyebrow">03 — EXPERIENCE</p>
          <h2>Learning through <span>experience.</span></h2>

          <article className="timeline-card">
            <div className="timeline-marker" />
            <div>
              <p className="card-kicker">INTERNSHIP</p>
              <h3>Persevex</h3>
              <p className="body-copy">
                Developing technical skills through training and
                practical project work.
              </p>
            </div>
            <span className="card-index">01</span>
          </article>
        </section>

        <section className="section-width content-section" id="projects">
          <p className="eyebrow">04 — SELECTED WORK</p>
          <h2>Projects built with <span>purpose.</span></h2>

          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.number}>
                <div className="project-top">
                  <span className="project-number">{project.number}</span>
                  <span className="project-icon">↗</span>
                </div>

                <p className="card-kicker">{project.type}</p>
                <h3>{project.name}</h3>
                <p className="body-copy">{project.description}</p>

                <div className="tech-list">
                  {project.tech.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-width content-section" id="education">
          <p className="eyebrow">05 — EDUCATION</p>
          <h2>My academic <span>foundation.</span></h2>

          <article className="education-card">
            <div className="education-symbol">BCA</div>
            <div>
              <p className="card-kicker">UNDERGRADUATE DEGREE</p>
              <h3>Bachelor of Computer Applications</h3>
              <p className="body-copy">
                JSS Science and Technology University
              </p>
              <p className="body-copy">
                Mysuru, Karnataka · Second year
              </p>
            </div>
          </article>
        </section>

        <section className="contact-section" id="contact">
          <div className="section-width contact-inner">
            <p className="eyebrow">06 — GET IN TOUCH</p>
            <h2>
              Good things start
              <br />
              with a <span>conversation.</span>
            </h2>

            <p className="body-copy">
              Interested in collaborating, sharing ideas or discussing
              opportunities? I'd love to hear from you.
            </p>

            <a
              className="button button-primary"
              href="mailto:shankarshreevidya@gmail.com"
            >
              Say hello ↗
            </a>

            <p className="email-text">shankarshreevidya@gmail.com</p>
          </div>
        </section>
      </main>

      <footer className="footer section-width">
        <a className="brand" href="#home">
          Shree Vidya<span>.</span>
        </a>
        <p>Designed with curiosity. Built with code.</p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </div>
  );
}

export default App;
