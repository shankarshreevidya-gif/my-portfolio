
import { useEffect, useState } from "react";
import axios from "axios";
import { useForm, useFieldArray } from "react-hook-form";
import "./Dashboard.css";

const API = "https://localhost:5000"; // Replace with your backend API URL

const emptyProject = {
  title: "",
  description: "",
  techStack: [],
  repoLink: "",
  liveLink: "",
  screenshot: ""
};

export default function Dashboard() {
  const [token, setToken] = useState(
    () => localStorage.getItem("codefolioToken") || ""
  );
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch
  } = useForm({
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      bio: "",
      resumeUrl: "",
      socialLinks: {
        github: "",
        linkedin: "",
        website: ""
      },
      projects: [{ ...emptyProject }],
      skills: [
        { category: "Frontend", items: [] },
        { category: "Backend", items: [] },
        { category: "DevOps", items: [] }
      ],
      templateId: "minimalist"
    }
  });

  const {
    fields: projects,
    append,
    remove
  } = useFieldArray({ control, name: "projects" });

  const formData = watch();

  const request = (url, options = {}) =>
    axios({
      url: `${API}${url}`,
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });

  useEffect(() => {
    if (!token) return;

    request("/api/me")
      .then(({ data }) => {
        reset({
          ...data,
          password: "",
          skills: data.skills?.length
            ? data.skills.map((skill) => ({
                category: skill.category,
                items: skill.items || []
              }))
            : [
                { category: "Frontend", items: [] },
                { category: "Backend", items: [] },
                { category: "DevOps", items: [] }
              ],
          projects: data.projects?.length
            ? data.projects.map((project) => ({
                ...project,
                techStack: project.techStack || []
              }))
            : [{ ...emptyProject }]
        });
      })
      .catch(() => {
        localStorage.removeItem("codefolioToken");
        setToken("");
        setMessage("Please log in again.");
      });
    // Load profile when the login token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function authenticate(values) {
    try {
      setMessage("");

      const endpoint =
        mode === "register"
          ? "/api/auth/register"
          : "/api/auth/login";

      const { data } = await axios.post(`${API}${endpoint}`, values);

      localStorage.setItem("codefolioToken", data.token);
      setToken(data.token);
      setMessage(data.message || "Success!");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not connect to the server."
      );
    }
  }

  async function savePortfolio(values) {
    try {
      const cleaned = {
        ...values,
        projects: values.projects.map((project) => ({
          ...project,
          techStack: Array.isArray(project.techStack)
            ? project.techStack
            : String(project.techStack || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
        })),
        skills: values.skills.map((skill) => ({
          ...skill,
          items: Array.isArray(skill.items)
            ? skill.items
            : String(skill.items || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
        }))
      };

      const { data } = await request("/api/me", {
        method: "PUT",
        data: cleaned
      });

      setMessage(data.message || "Portfolio saved!");
      setSaved(true);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not save your portfolio."
      );
      setSaved(false);
    }
  }

  function logout() {
    localStorage.removeItem("codefolioToken");
    setToken("");
    setSaved(false);
    setMessage("You have logged out.");
  }

  if (!token) {
    return (
      <main className="cf-auth">
        <form
          className="cf-auth-card"
          onSubmit={handleSubmit(authenticate)}
        >
          <p className="cf-eyebrow">YOUR DEVELOPER IDENTITY</p>
          <h1>Code<span>Folio</span></h1>
          <p>Build your portfolio. Share your work.</p>

          {mode === "register" && (
            <>
              <label>Username</label>
              <input
                {...register("username", { required: true })}
                placeholder="your-username"
                minLength={3}
                required
              />

              <label>Full name</label>
              <input
                {...register("name", { required: true })}
                placeholder="Your name"
                required
              />
            </>
          )}

          <label>Email</label>
          <input
            type="email"
            {...register("email", { required: true })}
            placeholder="you@example.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            {...register("password", { required: true, minLength: 8 })}
            placeholder="At least 8 characters"
            minLength={8}
            required
          />

          <button className="cf-primary" type="submit">
            {mode === "register" ? "Create account" : "Log in"}
          </button>

          <p className="cf-message" role="status">{message}</p>

          <button
            className="cf-text-button"
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMessage("");
            }}
          >
            {mode === "login"
              ? "New here? Create an account"
              : "Already registered? Log in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="cf-dashboard">
      <header className="cf-header">
        <a className="cf-logo" href="/">Code<span>Folio</span></a>
        <div>
          <a
            className="cf-public-link"
            href={`/user/${formData.username || ""}`}
            target="_blank"
            rel="noreferrer"
          >
            Public portfolio ↗
          </a>
          <button className="cf-secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className="cf-heading">
        <p className="cf-eyebrow">WORKSPACE / BUILDER</p>
        <h1>Your professional story.</h1>
        <p>Update your details and shape your portfolio.</p>
      </div>

      <div className="cf-workspace">
        <form
          className="cf-editor"
          onSubmit={handleSubmit(savePortfolio)}
        >
          <section className="cf-panel">
            <h2>01 — Profile</h2>

            <label>Username</label>
            <input
              value={formData.username || ""}
              readOnly
              aria-label="Username"
            />
            <small>Your public URL uses this username.</small>

            <label>Full name</label>
            <input {...register("name", { required: true })} required />

            <label>Professional bio</label>
            <textarea
              {...register("bio")}
              rows={4}
              placeholder="Tell the world what you build..."
            />

            <label>Resume URL</label>
            <input
              {...register("resumeUrl")}
              placeholder="https://..."
            />
          </section>

          <section className="cf-panel">
            <h2>02 — Social links</h2>
            <label>GitHub</label>
            <input {...register("socialLinks.github")} placeholder="https://github.com/..." />
            <label>LinkedIn</label>
            <input {...register("socialLinks.linkedin")} placeholder="https://linkedin.com/in/..." />
            <label>Personal website</label>
            <input {...register("socialLinks.website")} placeholder="https://..." />
          </section>

          <section className="cf-panel">
            <div className="cf-section-heading">
              <h2>03 — Projects</h2>
              <button
                type="button"
                className="cf-secondary"
                onClick={() => append({ ...emptyProject })}
              >
                + Add project
              </button>
            </div>

            {projects.map((project, index) => (
              <div className="cf-project-form" key={project.id}>
                <div className="cf-section-heading">
                  <h3>Project {index + 1}</h3>
                  {projects.length > 1 && (
                    <button
                      type="button"
                      className="cf-remove"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <label>Title</label>
                <input
                  {...register(`projects.${index}.title`, {
                    required: true
                  })}
                  required
                />

                <label>Description</label>
                <textarea
                  {...register(`projects.${index}.description`)}
                  rows={3}
                />

                <label>Tech stack (comma-separated)</label>
                <input
                  {...register(`projects.${index}.techStack`)}
                  placeholder="React, Node.js, MongoDB"
                />

                <label>Repository URL</label>
                <input {...register(`projects.${index}.repoLink`)} />

                <label>Live project URL</label>
                <input {...register(`projects.${index}.liveLink`)} />

                <label>Screenshot URL</label>
                <input {...register(`projects.${index}.screenshot`)} />
              </div>
            ))}
          </section>

          <section className="cf-panel">
            <h2>04 — Skills</h2>

            {formData.skills?.map((skill, index) => (
              <div key={skill.category}>
                <label>{skill.category} skills (comma-separated)</label>
                <input
                  {...register(`skills.${index}.items`)}
                  defaultValue={(skill.items || []).join(", ")}
                  placeholder="React, JavaScript"
                />
              </div>
            ))}
          </section>

          <section className="cf-panel">
            <h2>05 — Choose your theme</h2>
            <div className="cf-theme-options">
              <label>
                <input
                  type="radio"
                  value="minimalist"
                  {...register("templateId")}
                />
                Minimalist
              </label>
              <label>
                <input
                  type="radio"
                  value="cyberpunk"
                  {...register("templateId")}
                />
                Cyberpunk
              </label>
            </div>
          </section>

          <button className="cf-primary cf-save" type="submit">
            Save portfolio
          </button>
          <p className="cf-message" role="status">{message}</p>
        </form>

        <aside className={`cf-preview ${formData.templateId === "cyberpunk" ? "cf-preview-cyber" : ""}`}>
          <p className="cf-eyebrow">LIVE PREVIEW</p>
          <h2>{formData.name || "Your Name"}</h2>
          <p>{formData.bio || "Your professional bio appears here."}</p>

          <div className="cf-preview-links">
            {formData.socialLinks?.github && (
              <a href={formData.socialLinks.github} target="_blank" rel="noreferrer">GitHub ↗</a>
            )}
            {formData.socialLinks?.linkedin && (
              <a href={formData.socialLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
            )}
          </div>

          <h3>Selected theme</h3>
          <span className="cf-theme-pill">{formData.templateId}</span>

          <h3>Projects</h3>
          {(formData.projects || []).filter((p) => p.title).map((project, index) => (
            <article className="cf-preview-project" key={index}>
              <strong>{project.title}</strong>
              <p>{project.description}</p>
            </article>
          ))}

          <p className="cf-preview-foot">
            {saved ? "Last save completed" : "Preview updates as you type"}
          </p>
        </aside>
      </div>
    </main>
  );
}
