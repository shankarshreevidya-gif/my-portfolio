
import { useEffect, useState } from "react";
import axios from "axios";
import { useForm, useFieldArray } from "react-hook-form";
import "./Dashboard.css";

const API = "https://my-portfolio-backend-bdq0.onrender.com";

const emptyProject = {
  title: "",
  description: "",
  techStack: "",
  repoLink: "",
  liveLink: "",
  screenshot: ""
};

const emptySkills = [
  { category: "Frontend", items: "" },
  { category: "Backend", items: "" },
  { category: "DevOps", items: "" }
];

function getErrorMessage(error, fallback) {
  if (error.response) {
    const serverMessage = error.response.data?.message;

    if (serverMessage) {
      return serverMessage;
    }

    return `Server error (${error.response.status}). Please try again.`;
  }

  if (error.code === "ERR_NETWORK") {
    return "Cannot reach the server. Check the backend URL, CORS settings, and Render status.";
  }

  if (error.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  return error.message || fallback;
}

function splitItems(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProject(project = {}) {
  return {
    title: project.title || "",
    description: project.description || "",
    techStack: splitItems(project.techStack).join(", "),
    repoLink: project.repoLink || "",
    liveLink: project.liveLink || "",
    screenshot: project.screenshot || ""
  };
}

function normalizeSkills(skills) {
  if (!skills?.length) {
    return emptySkills.map((skill) => ({ ...skill }));
  }

  return skills.map((skill) => ({
    category: skill.category || "Other",
    items: splitItems(skill.items).join(", ")
  }));
}

export default function Dashboard() {
  const [token, setToken] = useState(
    () => localStorage.getItem("codefolioToken") || ""
  );
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

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
      skills: emptySkills.map((skill) => ({ ...skill })),
      templateId: "minimalist"
    }
  });

  const {
    fields: projects,
    append,
    remove
  } = useFieldArray({
    control,
    name: "projects"
  });

  const formData = watch();

  function showMessage(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  async function apiRequest(url, options = {}, authToken = token) {
    return axios({
      baseURL: API,
      url,
      timeout: 30000,
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(authToken
          ? { Authorization: `Bearer ${authToken}` }
          : {})
      }
    });
  }

  useEffect(() => {
    if (!token) {
      setProfileLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);

      try {
        const { data } = await apiRequest("/api/me");

        if (cancelled) return;

        reset({
          username: data.username || "",
          name: data.name || "",
          email: data.email || "",
          password: "",
          bio: data.bio || "",
          resumeUrl: data.resumeUrl || "",
          socialLinks: {
            github: data.socialLinks?.github || "",
            linkedin: data.socialLinks?.linkedin || "",
            website: data.socialLinks?.website || ""
          },
          projects: data.projects?.length
            ? data.projects.map(normalizeProject)
            : [{ ...emptyProject }],
          skills: normalizeSkills(data.skills),
          templateId: data.templateId || "minimalist"
        });
      } catch (error) {
        if (cancelled) return;

        console.error("Profile loading error:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("codefolioToken");
          setToken("");
          showMessage("Your session expired. Please log in again.", "error");
        } else {
          showMessage(
            getErrorMessage(error, "Could not load your profile."),
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
    // Load the profile when the token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, reset]);

  async function authenticate(values) {
    setLoading(true);
    showMessage("");

    try {
      const endpoint =
        mode === "register"
          ? "/api/auth/register"
          : "/api/auth/login";

      const payload =
        mode === "register"
          ? {
              username: values.username.trim().toLowerCase(),
              name: values.name.trim(),
              email: values.email.trim().toLowerCase(),
              password: values.password
            }
          : {
              email: values.email.trim().toLowerCase(),
              password: values.password
            };

      const { data } = await apiRequest(
        endpoint,
        {
          method: "POST",
          data: payload
        },
        ""
      );

      if (!data.token) {
        throw new Error(
          "The server responded without a login token. Check the backend authentication code."
        );
      }

      localStorage.setItem("codefolioToken", data.token);
      setToken(data.token);

      showMessage(
        data.message ||
          (mode === "register"
            ? "Account created successfully!"
            : "Login successful!"),
        "success"
      );
    } catch (error) {
      console.error("CodeFolio authentication error:", error);

      showMessage(
        getErrorMessage(error, "Authentication failed. Please try again."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function savePortfolio(values) {
    setLoading(true);
    showMessage("");
    setSaved(false);

    try {
      const cleaned = {
        ...values,
        password: undefined,
        socialLinks: {
          github: values.socialLinks?.github?.trim() || "",
          linkedin: values.socialLinks?.linkedin?.trim() || "",
          website: values.socialLinks?.website?.trim() || ""
        },
        projects: (values.projects || []).map((project) => ({
          ...project,
          techStack: splitItems(project.techStack)
        })),
        skills: (values.skills || []).map((skill) => ({
          category: skill.category,
          items: splitItems(skill.items)
        }))
      };

      const { password, ...portfolioData } = cleaned;

      const { data } = await apiRequest("/api/me", {
        method: "PUT",
        data: portfolioData
      });

      showMessage(data.message || "Portfolio saved successfully!", "success");
      setSaved(true);
    } catch (error) {
      console.error("CodeFolio save error:", error);

      showMessage(
        getErrorMessage(error, "Could not save your portfolio."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("codefolioToken");
    setToken("");
    setSaved(false);
    reset();
    showMessage("You have logged out.", "success");
  }

  if (!token) {
    return (
      <main className="cf-auth">
        <form
          className="cf-auth-card"
          onSubmit={handleSubmit(authenticate)}
        >
          <p className="cf-eyebrow">YOUR DEVELOPER IDENTITY</p>

          <h1>
            Code<span>Folio</span>
          </h1>

          <p>Build your portfolio. Share your work.</p>

          {mode === "register" && (
            <>
              <label htmlFor="cf-username">Username</label>
              <input
                id="cf-username"
                {...register("username", {
                  required: "Username is required.",
                  minLength: {
                    value: 3,
                    message: "Username must contain at least 3 characters."
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_-]+$/,
                    message:
                      "Use only letters, numbers, underscores, and hyphens."
                  }
                })}
                placeholder="your-username"
                autoComplete="username"
                minLength={3}
                required
              />

              <label htmlFor="cf-name">Full name</label>
              <input
                id="cf-name"
                {...register("name", {
                  required: "Full name is required."
                })}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </>
          )}

          <label htmlFor="cf-email">Email</label>
          <input
            id="cf-email"
            type="email"
            {...register("email", {
              required: "Email is required."
            })}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="cf-password">Password</label>
          <input
            id="cf-password"
            type="password"
            {...register("password", {
              required: "Password is required.",
              minLength: {
                value: 8,
                message: "Password must contain at least 8 characters."
              }
            })}
            placeholder="At least 8 characters"
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            minLength={8}
            required
          />

          <button
            className="cf-primary"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "register"
                ? "Create account"
                : "Log in"}
          </button>

          <p
            className="cf-message"
            role="status"
            aria-live="polite"
            data-type={messageType}
          >
            {message}
          </p>

          <button
            className="cf-text-button"
            type="button"
            disabled={loading}
            onClick={() => {
              setMode((current) =>
                current === "login" ? "register" : "login"
              );
              showMessage("");
              reset({
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
                skills: emptySkills.map((skill) => ({ ...skill })),
                templateId: "minimalist"
              });
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
        <a className="cf-logo" href="/">
          Code<span>Folio</span>
        </a>

        <div>
          <a
            className="cf-public-link"
            href={`/user/${encodeURIComponent(formData.username || "")}`}
            target="_blank"
            rel="noreferrer"
          >
            Public portfolio ↗
          </a>

          <button
            className="cf-secondary"
            type="button"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="cf-heading">
        <p className="cf-eyebrow">WORKSPACE / BUILDER</p>
        <h1>Your professional story.</h1>
        <p>Update your details and shape your portfolio.</p>
      </div>

      {profileLoading && (
        <p className="cf-message" role="status">
          Loading your profile...
        </p>
      )}

      <div className="cf-workspace">
        <form
          className="cf-editor"
          onSubmit={handleSubmit(savePortfolio)}
        >
          <section className="cf-panel">
            <h2>01 — Profile</h2>

            <label htmlFor="cf-profile-username">Username</label>
            <input
              id="cf-profile-username"
              value={formData.username || ""}
              readOnly
              aria-label="Username"
            />

            <small>Your public URL uses this username.</small>

            <label htmlFor="cf-profile-name">Full name</label>
            <input
              id="cf-profile-name"
              {...register("name", { required: true })}
              required
            />

            <label htmlFor="cf-profile-bio">Professional bio</label>
            <textarea
              id="cf-profile-bio"
              {...register("bio")}
              rows={4}
              placeholder="Tell the world what you build..."
            />

            <label htmlFor="cf-profile-resume">Resume URL</label>
            <input
              id="cf-profile-resume"
              type="url"
              {...register("resumeUrl")}
              placeholder="https://..."
            />
          </section>

          <section className="cf-panel">
            <h2>02 — Social links</h2>

            <label htmlFor="cf-github">GitHub</label>
            <input
              id="cf-github"
              type="url"
              {...register("socialLinks.github")}
              placeholder="https://github.com/..."
            />

            <label htmlFor="cf-linkedin">LinkedIn</label>
            <input
              id="cf-linkedin"
              type="url"
              {...register("socialLinks.linkedin")}
              placeholder="https://linkedin.com/in/..."
            />

            <label htmlFor="cf-website">Personal website</label>
            <input
              id="cf-website"
              type="url"
              {...register("socialLinks.website")}
              placeholder="https://..."
            />
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

                <label htmlFor={`cf-project-title-${index}`}>
                  Title
                </label>
                <input
                  id={`cf-project-title-${index}`}
                  {...register(`projects.${index}.title`, {
                    required: true
                  })}
                  required
                />

                <label htmlFor={`cf-project-description-${index}`}>
                  Description
                </label>
                <textarea
                  id={`cf-project-description-${index}`}
                  {...register(`projects.${index}.description`)}
                  rows={3}
                />

                <label htmlFor={`cf-project-tech-${index}`}>
                  Tech stack (comma-separated)
                </label>
                <input
                  id={`cf-project-tech-${index}`}
                  {...register(`projects.${index}.techStack`)}
                  placeholder="React, Node.js, MongoDB"
                />

                <label htmlFor={`cf-project-repo-${index}`}>
                  Repository URL
                </label>
                <input
                  id={`cf-project-repo-${index}`}
                  type="url"
                  {...register(`projects.${index}.repoLink`)}
                  placeholder="https://github.com/..."
                />

                <label htmlFor={`cf-project-live-${index}`}>
                  Live project URL
                </label>
                <input
                  id={`cf-project-live-${index}`}
                  type="url"
                  {...register(`projects.${index}.liveLink`)}
                  placeholder="https://..."
                />

                <label htmlFor={`cf-project-image-${index}`}>
                  Screenshot URL
                </label>
                <input
                  id={`cf-project-image-${index}`}
                  type="url"
                  {...register(`projects.${index}.screenshot`)}
                  placeholder="https://..."
                />
              </div>
            ))}
          </section>

          <section className="cf-panel">
            <h2>04 — Skills</h2>

            {formData.skills?.map((skill, index) => (
              <div key={skill.category}>
                <label htmlFor={`cf-skill-${index}`}>
                  {skill.category} skills (comma-separated)
                </label>

                <input
                  id={`cf-skill-${index}`}
                  {...register(`skills.${index}.items`)}
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

          <button
            className="cf-primary cf-save"
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save portfolio"}
          </button>

          <p
            className="cf-message"
            role="status"
            aria-live="polite"
            data-type={messageType}
          >
            {message}
          </p>
        </form>

        <aside
          className={`cf-preview ${
            formData.templateId === "cyberpunk"
              ? "cf-preview-cyber"
              : ""
          }`}
        >
          <p className="cf-eyebrow">LIVE PREVIEW</p>

          <h2>{formData.name || "Your Name"}</h2>

          <p>
            {formData.bio || "Your professional bio appears here."}
          </p>

          <div className="cf-preview-links">
            {formData.socialLinks?.github && (
              <a
                href={formData.socialLinks.github}
                target="_blank"
                rel="noreferrer"
              >
                GitHub ↗
              </a>
            )}

            {formData.socialLinks?.linkedin && (
              <a
                href={formData.socialLinks.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn ↗
              </a>
            )}

            {formData.socialLinks?.website && (
              <a
                href={formData.socialLinks.website}
                target="_blank"
                rel="noreferrer"
              >
                Website ↗
              </a>
            )}
          </div>

          <h3>Selected theme</h3>
          <span className="cf-theme-pill">
            {formData.templateId || "minimalist"}
          </span>

          <h3>Projects</h3>

          {(formData.projects || [])
            .filter((project) => project.title)
            .map((project, index) => (
              <article
                className="cf-preview-project"
                key={index}
              >
                <strong>{project.title}</strong>
                <p>{project.description}</p>

                {splitItems(project.techStack).length > 0 && (
                  <small>
                    {splitItems(project.techStack).join(" · ")}
                  </small>
                )}
              </article>
            ))}

          <p className="cf-preview-foot">
            {saved
              ? "Last save completed"
              : "Preview updates as you type"}
          </p>
        </aside>
      </div>
    </main>
  );
}
