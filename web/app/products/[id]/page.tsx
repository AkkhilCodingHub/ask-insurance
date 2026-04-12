import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getProductById } from "@/lib/products";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = getProductById(params.id);
  if (!product) return notFound();

  const Icon = product.icon;

  return (
    <>
      <Navbar />
      <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <section style={{ background: "linear-gradient(135deg, #062663 0%, #0B4E9C 65%, #1D4ED8 100%)", color: "#fff", padding: "72px 24px 70px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <span style={{ display: "inline-block", marginBottom: 16, fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.78)" }}>
              {product.label}
            </span>
            <h1 style={{ fontSize: 42, lineHeight: 1.05, fontWeight: 900, marginBottom: 18 }}>
              {product.label} built for modern Indian customers.
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 1.8, maxWidth: 620, margin: "0 auto" }}>
              {product.desc} Compare top insurers, select add-ons, and purchase with instant approvals and minimal paperwork.
            </p>
            <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 28, padding: "14px 26px", borderRadius: 12, background: "rgba(255,255,255,0.12)", color: "#fff", textDecoration: "none", fontWeight: 700 }}>
              Back to products
            </Link>
          </div>
        </section>

        <section style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 32, alignItems: "start" }}>
            <div style={{ background: "#fff", borderRadius: 28, padding: "32px 34px", boxShadow: "0 24px 52px rgba(15, 23, 42, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: `${product.color}1A`, display: "grid", placeItems: "center" }}>
                  <Icon size={26} color={product.color} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: product.color }}>Product category</p>
                  <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "var(--text)" }}>{product.label}</h2>
                </div>
              </div>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.75, marginBottom: 24 }}>{product.desc}</p>
              <div style={{ display: "grid", gap: 16 }}>
                {product.highlights.map((highlight) => (
                  <div key={highlight} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: product.color }} />
                    <span style={{ color: "var(--text)", fontSize: 14 }}>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <aside style={{ display: "grid", gap: 18 }}>
              <div style={{ background: "#fff", borderRadius: 24, padding: "28px", boxShadow: "0 20px 36px rgba(15, 23, 42, 0.08)" }}>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--primary)", marginBottom: 12 }}>Plan highlights</p>
                <p style={{ fontSize: 32, fontWeight: 900, margin: 0, color: product.color }}>{product.plans}</p>
              </div>
              <div style={{ background: "#fff", borderRadius: 24, padding: "28px", boxShadow: "0 20px 36px rgba(15, 23, 42, 0.08)" }}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--text)" }}>Ready to compare?</p>
                <Link href="/register" style={{ display: "block", textDecoration: "none", borderRadius: 14, padding: "14px 18px", background: product.color, color: "#fff", fontWeight: 700, textAlign: "center" }}>
                  Get personalised quote
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
