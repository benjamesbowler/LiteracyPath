function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function TeacherPageShell({
  as: Element = "main",
  className = "",
  product = "",
  intent = "",
  children
}) {
  return (
    <Element
      className={joinClassNames("teacher-product-page", className)}
      data-teacher-product={product || undefined}
      data-teacher-intent={intent || undefined}
    >
      {children}
    </Element>
  );
}

export function TeacherPageHeader({
  className = "",
  eyebrow,
  title,
  description,
  brand,
  children
}) {
  return (
    <section className={joinClassNames("teacher-page-header", className)}>
      <div>
        {brand || (eyebrow && <p className="panel-label">{eyebrow}</p>)}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function TeacherFilterBar({
  className = "",
  label,
  children
}) {
  return (
    <section
      className={joinClassNames("teacher-filter-bar", className)}
      aria-label={label}
    >
      {children}
    </section>
  );
}

export function TeacherDataTable({
  className = "",
  label,
  children
}) {
  return (
    <div
      className="table-scroll teacher-data-table-region"
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table className={className}>{children}</table>
    </div>
  );
}

export function TeacherChart({
  className = "",
  label,
  children
}) {
  return (
    <div
      className={className}
      role="img"
      aria-label={label}
    >
      {children}
    </div>
  );
}
