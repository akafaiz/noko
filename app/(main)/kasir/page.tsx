"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  CheckCircle2,
  Lock,
  Unlock,
  Trash2,
  Pencil,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAppSettings } from "@/lib/settings";
import {
  useProducts,
  setProducts,
  usePin,
  uid,
  type Product,
} from "@/lib/assistantData";

type Method = "tunai" | "qris" | "transfer";
type Tx = {
  id: number;
  item: string;
  qty: number;
  modal: number;
  jual: number;
  total: number;
  margin: number;
  method: Method;
  date: string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const METHODS: { key: Method; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "tunai", icon: Banknote },
  { key: "qris", icon: QrCode },
  { key: "transfer", icon: ArrowLeftRight },
];

const rupiah = (n: number) =>
  "Rp" + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

function QrPattern({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) & 0x7fffffff;
    s = s || 1;
    const arr: boolean[] = [];
    for (let i = 0; i < 21 * 21; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      arr.push((s & 1) === 1);
    }
    return arr;
  }, [seed]);

  return (
    <div
      className="grid rounded-lg bg-white p-2"
      style={{ gridTemplateColumns: "repeat(21, 1fr)", width: 180, height: 180 }}
    >
      {cells.map((on, i) => (
        <div key={i} className={on ? "bg-black" : "bg-white"} style={{ aspectRatio: "1" }} />
      ))}
    </div>
  );
}

export default function KasirPage() {
  const { t } = useT();
  const settings = useAppSettings();
  const qrisImage = settings.qrisImage;
  const pin = usePin();
  const products = useProducts();

  const [item, setItem] = useState("");
  const [qty, setQty] = useState(1);
  const [modal, setModal] = useState(0);
  const [jual, setJual] = useState(0);
  const [method, setMethod] = useState<Method>("tunai");
  const [history, setHistory] = useState<Tx[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [unlocked, setUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr] = useState<string | null>(null);

  const [manage, setManage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pName, setPName] = useState("");
  const [pModal, setPModal] = useState(0);
  const [pJual, setPJual] = useState(0);

  const total = (Number(jual) || 0) * (Number(qty) || 0);
  const margin = ((Number(jual) || 0) - (Number(modal) || 0)) * (Number(qty) || 0);

  const applyProduct = (p: Product) => {
    setItem(p.name);
    setModal(p.modal);
    setJual(p.jual);
    setQty(1);
  };

  const tryUnlock = () => {
    if (pinInput === pin) {
      setUnlocked(true);
      setShowPin(false);
      setPinInput("");
      setPinErr(null);
    } else {
      setPinErr(t("pinWrong"));
    }
  };

  const startManage = () => {
    if (!unlocked) {
      setShowPin(true);
      return;
    }
    setManage((m) => !m);
  };

  const saveProduct = () => {
    const name = pName.trim();
    if (!name) return;
    if (editingId) {
      setProducts(
        products.map((p) =>
          p.id === editingId
            ? { ...p, name, modal: Number(pModal) || 0, jual: Number(pJual) || 0 }
            : p
        )
      );
    } else {
      setProducts([
        ...products,
        { id: uid(), name, modal: Number(pModal) || 0, jual: Number(pJual) || 0 },
      ]);
    }
    setEditingId(null);
    setPName("");
    setPModal(0);
    setPJual(0);
  };

  const editProduct = (p: Product) => {
    setEditingId(p.id);
    setPName(p.name);
    setPModal(p.modal);
    setPJual(p.jual);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setPName("");
    setPModal(0);
    setPJual(0);
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    if (editingId === id) cancelEdit();
  };

  const catat = async () => {
    if (!item.trim() || total <= 0) {
      setNote(t("noteItemFirst"));
      return;
    }
    const id = `NOKO-${Date.now()}`;
    setOrderId(id);
    setNote(null);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, qty, modal, jual, method }),
      });
      const data = await res.json();
      if (data?.ok) {
        setNote(t("noteSaved"));
      } else if (String(data?.error ?? "").toLowerCase().includes("table")) {
        setNote(t("noteNoTable"));
      } else {
        setNote(`${t("noteFail")}: ${data?.error ?? "?"}`);
      }
    } catch {
      setNote(t("noteConnFail"));
    }

    if (method === "qris" && !qrisImage) {
      try {
        await fetch("/api/midtrans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: id, amount: total }),
        });
      } catch {
        /* fallback QRIS tetap tampil */
      }
    }

    setHistory((h) => [
      {
        id: Date.now(),
        item,
        qty,
        modal,
        jual,
        total,
        margin,
        method,
        date: new Date().toISOString(),
      },
      ...h,
    ]);
  };

  const exportCsv = () => {
    const header = [
      "Tanggal",
      "Nama Barang",
      "Jumlah",
      "Modal",
      "Harga Jual",
      "Margin Laba",
      "Metode Bayar",
    ];
    const rows = history.map((t2) => [
      t2.date,
      t2.item,
      t2.qty,
      t2.modal,
      t2.jual,
      t2.margin,
      t2.method,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noko-penjualan-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 min-h-[100dvh] overflow-y-auto md:overflow-hidden p-4 md:p-0">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="noko-card p-6"
      >
        <div className="flex items-center justify-between">
          <p className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
            {t("cashierMode")}
          </p>
          <motion.button
            onClick={startManage}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="noko-chip flex items-center gap-1 px-3 py-1.5 text-xs"
          >
            {unlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {t("manageMenu")}
          </motion.button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {products.map((p) => (
            <motion.button
              key={p.id}
              onClick={() => applyProduct(p)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="noko-chip px-3 py-1.5 text-xs"
            >
              {p.name} · {rupiah(p.jual)}
            </motion.button>
          ))}
          {products.length === 0 && (
            <span className="noko-faint text-xs">{t("noProducts")}</span>
          )}
        </div>

        <div className="mt-5">
          <label className="noko-faint mb-1 block text-xs">{t("itemName")}</label>
          <input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder={t("itemPlaceholder")}
            className="noko-input px-4 py-3 text-sm"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <label className="noko-faint mb-1 block text-xs">{t("qty")}</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="noko-input px-3 py-3 text-sm"
            />
          </div>
          <div>
            <label className="noko-faint mb-1 block text-xs">{t("modal")}</label>
            <input
              type="number"
              min={0}
              value={modal}
              onChange={(e) => setModal(Number(e.target.value))}
              className="noko-input px-3 py-3 text-sm"
            />
          </div>
          <div>
            <label className="noko-faint mb-1 block text-xs">{t("jual")}</label>
            <input
              type="number"
              min={0}
              value={jual}
              onChange={(e) => setJual(Number(e.target.value))}
              className="noko-input px-3 py-3 text-sm"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="noko-faint mb-2 block text-xs">{t("payMethod")}</label>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.key;
              return (
                <motion.button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  className={`noko-chip flex items-center gap-2 px-4 py-2 text-sm ${
                    active ? "noko-chip-active" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(m.key)}
                </motion.button>
              );
            })}
          </div>
        </div>

        {manage && unlocked && (
          <div className="mt-5 rounded-xl border noko-border p-3">
            <p className="noko-faint mb-2 text-xs font-semibold uppercase tracking-[0.25em]">
              {t("manageMenu")}
            </p>
            <div className="space-y-1 mb-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border noko-border px-3 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => editProduct(p)}>
                    <Pencil className="noko-muted h-3 w-3.5 shrink-0" />
                    <span className="noko-fg">{p.name}</span>
                    <span className="noko-muted text-[10px]">{rupiah(p.jual)}</span>
                  </div>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="noko-faint hover:opacity-70"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {products.length === 0 && <p className="noko-faint text-xs">{t("noProducts")}</p>}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <input
                placeholder={t("productName")}
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                className="noko-input px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder={t("modal")}
                value={pModal}
                onChange={(e) => setPModal(Number(e.target.value))}
                className="noko-input px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder={t("jual")}
                value={pJual}
                onChange={(e) => setPJual(Number(e.target.value))}
                className="noko-input px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={saveProduct}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="noko-accent flex-1 rounded-full py-2 text-xs font-semibold"
              >
                {editingId ? t("saveProduct") : t("addProduct")}
              </motion.button>
              {editingId && (
                <button onClick={cancelEdit} className="noko-chip rounded-full px-4 py-2 text-xs">
                  {t("cancel")}
                </button>
              )}
            </div>
          </div>
        )}
      </motion.section>

      <div className="flex flex-col gap-4">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.08 }}
          className="noko-card p-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
                {t("totalBelanja")}
              </p>
              <p className="noko-fg mt-2 text-3xl font-bold tracking-tight">{rupiah(total)}</p>
            </div>
            <div>
              <p className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
                {t("margin")}
              </p>
              <p className="noko-fg mt-2 text-3xl font-bold tracking-tight">{rupiah(margin)}</p>
            </div>
          </div>

          <motion.button
            onClick={catat}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className="noko-accent mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold"
          >
            <CreditCard className="h-4 w-4" />
            {method === "qris" && qrisImage ? t("confirmRecord") : t("catat")}
          </motion.button>

          {note && <p className="noko-muted mt-3 text-xs">{note}</p>}
        </motion.section>

        {method === "qris" && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="noko-card p-6"
          >
            <div className="flex items-center gap-2">
              <QrCode className="noko-muted h-4 w-4" />
              <p className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
                {t("qrisTitle")}
              </p>
            </div>
            <div className="mt-4 flex flex-col items-center gap-3">
              {qrisImage ? (
                <img
                  src={qrisImage}
                  alt="QRIS"
                  className="noko-border max-h-64 w-auto rounded-xl border bg-white p-2 object-contain"
                />
              ) : (
                <QrPattern seed={orderId ?? String(total)} />
              )}
              <p className="noko-muted text-xs">
                {qrisImage ? "" : orderId ?? t("qrisEmpty")}
              </p>
              {qrisImage && (
                <motion.button
                  onClick={catat}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="noko-accent px-4 py-2 text-xs font-semibold"
                >
                  {t("confirmRecord")}
                </motion.button>
              )}
              {!qrisImage && (
                <Link
                  href="/settings"
                  className="noko-chip px-4 py-2 text-xs font-semibold"
                >
                  {t("settings")}
                </Link>
              )}
            </div>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.12 }}
          className="noko-card p-6"
        >
          <div className="flex items-center justify-between">
            <p className="noko-faint text-xs font-semibold uppercase tracking-[0.25em]">
              {t("history")}
            </p>
            <motion.button
              onClick={exportCsv}
              disabled={history.length === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="noko-chip px-3 py-1.5 text-xs disabled:opacity-40"
            >
              {t("exportCsv")}
            </motion.button>
          </div>
          <div className="mt-3 space-y-2">
            {history.length === 0 && <p className="noko-muted text-sm">{t("noTx")}</p>}
            {history.map((tx) => (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="noko-card-hover noko-border flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="noko-fg truncate">{tx.item}</p>
                  <p className="noko-faint text-xs">
                    {tx.qty}× · {t(tx.method)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="noko-fg">{rupiah(tx.total)}</p>
                  <p className="noko-faint flex items-center justify-end gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3" /> {rupiah(tx.margin)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      {showPin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur"
          onClick={() => setShowPin(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="noko-card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="noko-fg text-sm font-semibold">{t("pinPrompt")}</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              autoFocus
              className="noko-input mt-2 px-3 py-2 text-sm"
            />
            {pinErr && <p className="noko-muted mt-1 text-xs">{pinErr}</p>}
            <div className="mt-4 flex gap-2">
              <motion.button
                onClick={tryUnlock}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="noko-accent flex-1 rounded-full py-2 text-sm font-semibold"
              >
                {t("unlock")}
              </motion.button>
              <button
                onClick={() => setShowPin(false)}
                className="noko-chip rounded-full px-4 py-2 text-xs"
              >
                {t("cancel")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}