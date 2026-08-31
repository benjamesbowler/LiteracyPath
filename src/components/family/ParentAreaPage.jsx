import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  CaretDown,
  CheckCircle,
  Clock,
  FileText,
  House,
  Info,
  Printer,
  ShieldCheck,
  SignOut,
  Sparkle,
  SpinnerGap,
  TrendUp,
  UserCircle,
  WarningCircle
} from "@phosphor-icons/react";
import logomarkUrl from "../../assets/logomark.png";
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUS_ORDER
} from "../../policy/reportingBible.js";
import "../../styles/parent-area.css";

const PRIMARY_SECTIONS = Object.freeze([
  { id: "overview", label: "Home", Icon: House },
  { id: "progress", label: "Progress", Icon: TrendUp },
  { id: "practice", label: "At home", Icon: BookOpenText },
  { id: "reports", label: "Reports", Icon: FileText }
]);

const PROGRESS_STATUS_LEGEND = Object.freeze(REPORT_STATUS_ORDER.map(id => ({
  id,
  label: REPORT_STATUS_LABELS[id]
})));

function ParentAreaLoading() {
  return (
    <main className="parent-area-state" aria-live="polite" aria-busy="true">
      <SpinnerGap className="parent-area-spinner" size={32} aria-hidden="true" />
      <h1>Loading your family area</h1>
      <p>We are getting the latest school update.</p>
    </main>
  );
}

function ParentAreaError({ onRetry, onSignOut }) {
  return (
    <main className="parent-area-state" role="alert">
      <span className="parent-area-state-icon"><WarningCircle size={30} aria-hidden="true" /></span>
      <h1>We could not load this update</h1>
      <p>Your child’s information has not been changed. Please try again.</p>
      <div className="parent-area-state-actions"><button type="button" className="pa-button pa-button-primary" onClick={onRetry}>Try again</button><button type="button" className="pa-button pa-button-secondary" onClick={onSignOut}>Sign out</button></div>
    </main>
  );
}

function ParentAreaEmpty({ onSignOut }) {
  return (
    <main className="parent-area-state">
      <span className="parent-area-state-icon"><UserCircle size={30} aria-hidden="true" /></span>
      <h1>No child is linked yet</h1>
      <p>Your school needs to invite you before a child’s information can appear here.</p>
      <p className="parent-area-state-note">Ask the school office or class teacher to check your family access.</p>
      <button type="button" className="pa-button pa-button-secondary" onClick={onSignOut}>Sign out</button>
    </main>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <header className="pa-section-heading">
      <div>
        {eyebrow ? <p className="pa-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

function Overview({ model, onChangeSection }) {
  const recentBook = model.recentReading[0];
  return (
    <div className="pa-page pa-overview-page" data-parent-section="overview">
      <section className="pa-overview-hero" aria-labelledby="parent-overview-title">
        <div className="pa-overview-copy">
          <p className="pa-eyebrow">Latest family update</p>
          <h1 id="parent-overview-title">{model.learner.name}’s reading, clearly explained</h1>
          <p className="pa-overview-highlight">{model.highlight}</p>
          <div className="pa-update-meta">
            <span><Clock size={18} aria-hidden="true" />{model.updatedLabel}</span>
            <button type="button" className="pa-text-button" onClick={() => onChangeSection("reports")}>
              View latest report <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
        {recentBook ? (
          <figure className="pa-book-feature">
            <img src={recentBook.coverUrl} alt="" />
            <figcaption>
              <span>Recently read</span>
              <strong>{recentBook.title}</strong>
              <small>{recentBook.detail}</small>
            </figcaption>
          </figure>
        ) : null}
      </section>

      <div className="pa-overview-grid">
        <section className="pa-panel pa-summary-panel" aria-labelledby="going-well-title">
          <div className="pa-panel-title-row">
            <span className="pa-panel-icon pa-panel-icon-success"><Sparkle size={21} aria-hidden="true" /></span>
            <div>
              <p className="pa-eyebrow">Strengths first</p>
              <h2 id="going-well-title">What is going well</h2>
            </div>
          </div>
          <ul className="pa-check-list">
            {model.strengths.map(item => (
              <li key={item}><CheckCircle weight="fill" size={20} aria-hidden="true" /><span>{item}</span></li>
            ))}
          </ul>
          <div className="pa-can-do">
            <h3>What {model.learner.name} can do now</h3>
            <ul>{model.canDo.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </section>

        <div className="pa-overview-side">
          <section className="pa-panel pa-next-panel" aria-labelledby="next-focus-title">
            <div className="pa-panel-title-row">
              <span className="pa-panel-icon"><TrendUp size={21} aria-hidden="true" /></span>
              <div>
                <p className="pa-eyebrow">Working on next</p>
                <h2 id="next-focus-title">The next teaching focus</h2>
              </div>
            </div>
            <ul className="pa-simple-list">
              {model.nextFocus.map(item => <li key={item}>{item}</li>)}
            </ul>
            <div className="pa-meaning-note">
              <Info size={20} aria-hidden="true" />
              <div><strong>What this means</strong><p>{model.meaning}</p></div>
            </div>
          </section>

          <section className="pa-panel pa-home-action" aria-labelledby="home-action-title">
            <div>
              <p className="pa-eyebrow">Try this at home</p>
              <h2 id="home-action-title">{model.atHome.title}</h2>
              <p>{model.atHome.introduction}</p>
              <span className="pa-duration"><Clock size={17} aria-hidden="true" />{model.atHome.durationLabel}</span>
            </div>
            <button type="button" className="pa-button pa-button-secondary" onClick={() => onChangeSection("practice")}>
              See the activity <ArrowRight size={17} aria-hidden="true" />
            </button>
          </section>
        </div>
      </div>

      <section className="pa-contact-strip" aria-label="Who to talk to">
        <div><strong>Who to talk to</strong><p>{model.contact.message}</p></div>
        {model.contact.email ? <a className="pa-button pa-button-quiet" href={`mailto:${model.contact.email}`}>Contact {model.contact.name}</a> : null}
      </section>
    </div>
  );
}

function Progress({ model }) {
  return (
    <div className="pa-page" data-parent-section="progress">
      <SectionHeading
        eyebrow="A clear picture"
        title={`${model.learner.name}’s progress`}
        description="The school shares a small number of reading areas in plain language. No class comparisons or rankings are shown."
      />
      <div className="pa-progress-key" aria-label="Progress wording">
        {PROGRESS_STATUS_LEGEND.map(status => (
          <span key={status.id}><i className={`is-${status.id}`} />{status.label}</span>
        ))}
      </div>
      <section className="pa-progress-list" aria-label="Reading progress areas">
        {model.progress.map(item => (
          <article className="pa-progress-row" key={item.id}>
            <div className="pa-progress-copy">
              <h2>{item.label}</h2>
              <p>{item.detail}</p>
            </div>
            <div className={`pa-status pa-status-${item.status}`}>
              <strong>{item.statusLabel}</strong>
              <span>{item.statusDescription}</span>
            </div>
          </article>
        ))}
      </section>
      <aside className="pa-context-note">
        <Info size={21} aria-hidden="true" />
        <div><strong>Progress is more than a score</strong><p>The school combines classroom learning, reading and carefully chosen checks before sharing an update.</p></div>
      </aside>
    </div>
  );
}

function Practice({ model, onPrintPlan }) {
  const languageLabels = { en: "English", es: "Español", "zh-Hans": "简体中文" };
  return (
    <div className="pa-page" data-parent-section="practice">
      <SectionHeading
        eyebrow="Family Bridge"
        title="Small things that help at home"
        description={`These activities match what ${model.learner.name} is learning in class. Choose one at a time and keep it relaxed.`}
        action={<span className="pa-plan-language">Plan language: {languageLabels[model.atHome.language] || model.atHome.language || "English"}</span>}
      />
      <section className="pa-practice-intro" aria-labelledby="practice-plan-title">
        <div><span>{model.atHome.durationLabel}</span><h2 id="practice-plan-title">{model.atHome.title}</h2><p>{model.atHome.introduction}</p></div>
        <button type="button" className="pa-button pa-button-secondary" onClick={() => onPrintPlan(model)}><Printer size={18} aria-hidden="true" />Print plan</button>
      </section>
      <ol className="pa-activity-list">
        {model.atHome.activities.map((activity, index) => (
          <li key={activity.title}>
            <span className="pa-activity-number">{index + 1}</span>
            <div><p>{activity.moment}</p><h3>{activity.title}</h3><span>{activity.direction}</span></div>
          </li>
        ))}
      </ol>
      <aside className="pa-privacy-note">
        <ShieldCheck size={24} aria-hidden="true" />
        <div><strong>Private, low-pressure practice</strong><p>{model.atHome.privacyText}</p></div>
      </aside>
    </div>
  );
}

function Reports({ model, onOpenReport, onPrintReport }) {
  return (
    <div className="pa-page" data-parent-section="reports">
      <SectionHeading
        eyebrow="Released by school"
        title="Reports and updates"
        description="Only family-ready reports shared by the school appear here. Internal notes and draft results stay private to school staff."
      />
      {model.reports.length ? (
        <section className="pa-report-list" aria-label="Family reports">
          {model.reports.map((report, index) => (
            <article className={`pa-report-card${index === 0 ? " pa-report-card-latest" : ""}`} key={report.id}>
              <span className="pa-report-icon"><FileText size={25} aria-hidden="true" /></span>
              <div>
                <div className="pa-report-meta"><span>{index === 0 ? "Latest report" : "Previous report"}</span><time dateTime={report.publishedAt}>{report.publishedLabel}</time></div>
                <h2>{report.title}</h2>
                <p>{report.summary}</p>
              </div>
              <div className="pa-report-actions">
                <button type="button" className="pa-button pa-button-secondary" onClick={() => onOpenReport(report, model)}><FileText size={18} aria-hidden="true" />Open</button>
                <button type="button" className="pa-icon-button" onClick={() => onPrintReport(report, model)} aria-label={`Print or save ${report.title}`}><Printer size={20} aria-hidden="true" /></button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="pa-inline-empty"><FileText size={28} aria-hidden="true" /><h2>No reports have been released yet</h2><p>The school will let you know when a family report is ready.</p></section>
      )}
      <section className="pa-contact-strip" aria-label="Questions about reports">
        <div><strong>Questions about a report?</strong><p>{model.contact.message}</p></div>
        {model.contact.email ? <a className="pa-button pa-button-quiet" href={`mailto:${model.contact.email}`}>Contact {model.contact.name}</a> : null}
      </section>
    </div>
  );
}

function Account({ models, model, preferredLanguage, reportNotifications, accountMessage, onUpdatePreferences, onSignOut }) {
  return (
    <div className="pa-page" data-parent-section="account">
      <SectionHeading eyebrow="Family account" title="Access and preferences" description="Manage how school updates reach you and see which children your school has linked." />
      <div className="pa-account-grid">
        <section className="pa-panel">
          <h2>Linked children</h2>
          <ul className="pa-linked-children">{models.map(item => <li key={item.learner.id}><span>{item.learner.name.slice(0, 1)}</span><div><strong>{item.learner.name}</strong><small>{item.learner.classLabel}, {item.learner.schoolName}</small></div>{item.learner.id === model.learner.id ? <em>Viewing</em> : null}</li>)}</ul>
          <p className="pa-helper-copy">The school controls family links. Contact the school to add or remove a child.</p>
        </section>
        <section className="pa-panel">
          <h2>Updates</h2>
          <label className="pa-setting-row"><span><strong>Allow report emails when available</strong><small>No report emails are sent during the beta. Your choice is saved for later.</small></span><input type="checkbox" checked={reportNotifications} onChange={event => onUpdatePreferences({ preferredLanguage, reportNotifications: event.target.checked })} /></label>
          <label className="pa-setting-row"><span><strong>Preferred family language</strong><small>Saved for future updates. A released report keeps the language chosen when the school shared it.</small></span><select value={preferredLanguage} onChange={event => onUpdatePreferences({ preferredLanguage: event.target.value, reportNotifications })}><option value="en">English</option><option value="es">Español</option><option value="zh-Hans">简体中文</option></select></label>
          {accountMessage ? <p className="pa-account-message" role="status">{accountMessage}</p> : null}
        </section>
        <section className="pa-panel pa-data-panel">
          <ShieldCheck size={25} aria-hidden="true" />
          <div><h2>Privacy and data rights</h2><p>Your school decides why your child’s learning information is used. Literacy Guide only shows information for children the school has securely linked to you.</p><a className="pa-text-button" href="/privacy.html" target="_blank" rel="noreferrer">Read the family privacy notice <ArrowRight size={17} aria-hidden="true" /></a></div>
        </section>
      </div>
      <button type="button" className="pa-sign-out" onClick={onSignOut}><SignOut size={19} aria-hidden="true" />Sign out</button>
    </div>
  );
}

export function ParentAreaPage({
  models = [],
  initialLearnerId,
  initialSection = "overview",
  state = "ready",
  preferredLanguage = "en",
  reportNotifications = false,
  accountMessage = "",
  onRetry = () => {},
  onOpenReport = () => {},
  onPrintPlan = () => {},
  onPrintReport = () => {},
  onSignOut = () => {},
  onUpdatePreferences = () => {}
}) {
  const [learnerId, setLearnerId] = useState(initialLearnerId || models[0]?.learner.id || "");
  const [section, setSection] = useState(initialSection);
  const model = useMemo(() => models.find(item => item.learner.id === learnerId) || models[0], [learnerId, models]);

  if (state === "loading") return <ParentAreaLoading />;
  if (state === "error") return <ParentAreaError onRetry={onRetry} onSignOut={onSignOut} />;
  if (!model) return <ParentAreaEmpty onSignOut={onSignOut} />;

  return (
    <div className="parent-area-shell">
      <a className="pa-skip-link" href="#parent-main">Skip to family update</a>
      <header className="pa-topbar">
        <div className="pa-topbar-inner">
          <button type="button" className="pa-brand" onClick={() => setSection("overview")} aria-label="Literacy Guide family home">
            <span><img src={logomarkUrl} alt="" /></span>
            <div><strong>Literacy Guide</strong><small>Family</small></div>
          </button>
          <div className="pa-topbar-actions">
            {models.length > 1 ? (
              <label className="pa-child-select"><span>Child</span><select value={model.learner.id} onChange={event => setLearnerId(event.target.value)} aria-label="Choose child">{models.map(item => <option value={item.learner.id} key={item.learner.id}>{item.learner.name}</option>)}</select><CaretDown size={16} aria-hidden="true" /></label>
            ) : <span className="pa-single-child">{model.learner.name}</span>}
            <button type="button" className={`pa-account-button${section === "account" ? " is-active" : ""}`} onClick={() => setSection("account")} aria-current={section === "account" ? "page" : undefined}><UserCircle size={23} aria-hidden="true" /><span>Account</span></button>
          </div>
        </div>
      </header>
      <nav className="pa-nav" aria-label="Family area">
        <div>{PRIMARY_SECTIONS.map(({ id, label, Icon }) => <button type="button" key={id} className={section === id ? "is-active" : ""} onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined}><Icon size={20} aria-hidden="true" /><span>{label}</span></button>)}</div>
      </nav>
      <main id="parent-main" className="pa-main" tabIndex="-1">
        {section === "overview" ? <Overview model={model} onChangeSection={setSection} /> : null}
        {section === "progress" ? <Progress model={model} /> : null}
        {section === "practice" ? <Practice model={model} onPrintPlan={onPrintPlan} /> : null}
        {section === "reports" ? <Reports model={model} onOpenReport={onOpenReport} onPrintReport={onPrintReport} /> : null}
        {section === "account" ? <Account models={models} model={model} preferredLanguage={preferredLanguage} reportNotifications={reportNotifications} accountMessage={accountMessage} onUpdatePreferences={onUpdatePreferences} onSignOut={onSignOut} /> : null}
      </main>
      <footer className="pa-footer"><span>Family information shared by {model.learner.schoolName}</span><span>Secure family access</span></footer>
    </div>
  );
}
