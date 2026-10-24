export function TrustBar({ items }: { items: { title: string; desc: string; icon: string }[] }) {
  return (
    <section className="trust">
      <div className="wrap trust-grid">
        {items.map((x) => (
          <div className="trust-item" key={x.title}>
            <div className="trust-ico">{x.icon}</div>
            <h4>{x.title}</h4>
            <p>{x.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
