// src/pages/ProductPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { money } from "@/components/utils";
import { useCart } from "@/components/cart/CartProvider";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import type { Product, ProductVariant } from "@/types";

export default function ProductPage() {
  const { slug } = useParams();
  const { add } = useCart();
  const [p, setP] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [hero, setHero] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/products/slug/${slug}`);
        const prod: Product = r.data;
        setP(prod);
        setSel(prod?.variants?.[0]?.id ?? null);
        setHero(prod?.images?.[0] ?? prod?.imageUrl ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <div className="py-16 text-center">Loading…</div>;
  if (!p) return <div className="py-16 text-center">Product not found.</div>;

  // ---- Daqui pra baixo "p" é não-nulo ----
  const currentVariant: ProductVariant | null =
    p.variants?.find((v) => v.id === sel) ?? null;

  const displayPrice =
    (currentVariant ? currentVariant.price : undefined) ??
    p.sale?.salePrice ??
    p.price ??
    0;

  function addToCart() {
    // proteção extra para o TS e para runtime
    if (!p) return;
    const priceToStore = p.visibility?.price === false ? null : displayPrice;

    if (currentVariant) {
      add(
        {
          id: p.id,
          variantId: currentVariant.id,
          variantName: currentVariant.name,
          name: `${p.name} — ${currentVariant.name}`,
          price: p.visibility?.price === false ? null : currentVariant.price,
          imageUrl: hero,
        },
        1
      );
    } else {
      add(
        { id: p.id, name: p.name, price: priceToStore, imageUrl: hero },
        1
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-black"
        >
          <FontAwesomeIcon icon={faChevronLeft} /> Back
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* gallery */}
        <div className="space-y-3">
          <div
            className="aspect-[4/3] rounded-2xl border bg-neutral-100"
            style={{
              backgroundImage: `url(${hero})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {p.visibility?.images !== false && (p.images?.length ?? 0) > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {p.images!.slice(0, 10).map((url, i) => (
                <button
                  key={i}
                  onClick={() => setHero(url)}
                  className={`aspect-square rounded-lg border bg-neutral-100 ${
                    hero === url ? "ring-2 ring-orange-600" : ""
                  }`}
                  style={{
                    backgroundImage: `url(${url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold">
            <span className="text-orange-600">Listo</span>
            <span className="text-black">365</span> — {p.name}
          </h1>

          {p.visibility?.description !== false && (
            <p className="text-neutral-700 leading-relaxed">{p.description}</p>
          )}

          {/* Variants */}
          {p.variants && p.variants.length > 0 && (
            <div>
              <div className="mb-1 text-sm font-medium">Size / Option</div>
              <div className="flex flex-wrap gap-2">
                {p.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSel(v.id)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      sel === v.id
                        ? "border-orange-600 text-orange-700 bg-orange-50"
                        : "hover:border-neutral-700"
                    }`}
                  >
                    {v.name} —{" "}
                    {p.visibility?.price === false
                      ? "See price at checkout"
                      : money.format(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="text-2xl font-bold">
            {p.visibility?.price === false
              ? "Request a quote"
              : money.format(displayPrice)}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={addToCart}
              className="rounded-xl bg-orange-600 px-5 py-3 text-white font-semibold shadow hover:bg-orange-700"
            >
              Add to cart
            </motion.button>

            {p.pdfUrl && p.visibility?.pdf !== false && (
              <a
                href={p.pdfUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm hover:border-neutral-700"
              >
                <FontAwesomeIcon icon={faFilePdf} /> Datasheet (PDF)
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Extras */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold text-orange-700">
            High performance
          </div>
          <p className="text-sm text-neutral-700 mt-1">
            Designed for exceptional response to high-speed burnishing
            programs.
          </p>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold text-orange-700">
            Non-yellowing
          </div>
          <p className="text-sm text-neutral-700 mt-1">
            Scuff and scratch resistant, resists black heel marks.
          </p>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold text-orange-700">Low odor</div>
          <p className="text-sm text-neutral-700 mt-1">
            VOC-compliant and friendlier for the environment.
          </p>
        </div>
      </div>
    </div>
  );
}
