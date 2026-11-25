"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, CalendarDays, ListTodo } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  useAgenda,
  setAgenda,
  useTodos,
  setTodos,
  todayKey,
  uid,
} from "@/lib/assistantData";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const WD_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Planner() {
  const { t, lang } = useT();
  const agenda = useAgenda();
  const todos = useTodos();

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(todayKey());
  const [agendaText, setAgendaText] = useState("");
  const [taskText, setTaskText] = useState("");

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(view.year, view.month, 1));
  const weekdays = lang === "en" ? WD_EN : WD_ID;

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const keyFor = (day: number) =>
    `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const shift = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const selectedItems = agenda[selected] ?? [];

  const addAgenda = () => {
    const text = agendaText.trim();
    if (!text) return;
    setAgenda({ ...agenda, [selected]: [...selectedItems, text] });
    setAgendaText("");
  };

  const removeAgenda = (idx: number) => {
    const next = selectedItems.filter((_, i) => i !== idx);
    setAgenda({ ...agenda, [selected]: next });
  };

  const addTask = () => {
    const text = taskText.trim();
    if (!text) return;
    setTodos([...todos, { id: uid(), text, done: false }]);
    setTaskText("");
  };

  const toggleTask = (id: string) => {
    setTodos(todos.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  };

  const removeTask = (id: string) => {
    setTodos(todos.filter((x) => x.id !== id));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="noko-card p-6"
      >
        <div className="flex items-center justify-between">
          <p className="noko-faint flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em]">
            <CalendarDays className="h-4 w-4" />
            {t("calendar")}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => shift(-1)}
              className="noko-chip flex h-7 w-7 items-center justify-center rounded-full"
              aria-label={t("prevMonth")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => shift(1)}
              className="noko-chip flex h-7 w-7 items-center justify-center rounded-full"
              aria-label={t("nextMonth")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="noko-fg mt-3 text-center text-sm font-medium">{monthLabel}</p>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {weekdays.map((w) => (
            <span key={w} className="noko-faint text-[10px] uppercase">
              {w}
            </span>
          ))}
          {cells.map((day, i) => {
            if (day == null) return <span key={`b-${i}`} />;
            const key = keyFor(day);
            const isToday = key === todayKey();
            const isSel = key === selected;
            const has = (agenda[key]?.length ?? 0) > 0;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
                  isSel ? "noko-accent" : "noko-chip"
                } ${isToday && !isSel ? "noko-accent-border" : ""}`}
              >
                {day}
                {has && (
                  <span
                    className="absolute bottom-0.5 h-1 w-1 rounded-full"
                    style={{ backgroundColor: isSel ? "var(--noko-accent-fg)" : "var(--noko-accent)" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <p className="noko-muted mb-2 text-xs">{t("agendaFor")} {selected}</p>
          <div className="space-y-1">
            {selectedItems.length === 0 && (
              <p className="noko-faint text-xs">{t("noAgenda")}</p>
            )}
            {selectedItems.map((item, i) => (
              <div
                key={`${item}-${i}`}
                className="noko-card-hover noko-border flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs"
              >
                <span className="noko-fg">{item}</span>
                <button
                  onClick={() => removeAgenda(i)}
                  className="noko-faint hover:opacity-70"
                  aria-label={t("delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={agendaText}
              onChange={(e) => setAgendaText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAgenda()}
              placeholder={t("agendaPlaceholder")}
              className="noko-input flex-1 px-3 py-2 text-xs"
            />
            <motion.button
              onClick={addAgenda}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="noko-accent flex h-9 w-9 items-center justify-center rounded-xl"
              aria-label={t("addAgenda")}
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.08 }}
        className="noko-card p-6"
      >
        <p className="noko-faint flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em]">
          <ListTodo className="h-4 w-4" />
          {t("todo")}
        </p>

        <div className="mt-3 flex gap-2">
          <input
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder={t("todoPlaceholder")}
            className="noko-input flex-1 px-3 py-2 text-sm"
          />
          <motion.button
            onClick={addTask}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="noko-accent flex h-9 w-9 items-center justify-center rounded-xl"
            aria-label={t("addTask")}
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="mt-3 space-y-1">
          {todos.length === 0 && <p className="noko-faint text-xs">{t("noTasks")}</p>}
          {todos.map((task) => (
            <div
              key={task.id}
              className="noko-card-hover noko-border flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  task.done ? "noko-accent noko-accent-border" : "noko-border"
                }`}
                aria-label={t("toggleTask")}
              >
                {task.done && <Check className="h-3 w-3" />}
              </button>
              <span
                className={`noko-fg flex-1 text-sm ${
                  task.done ? "line-through opacity-50" : ""
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => removeTask(task.id)}
                className="noko-faint hover:opacity-70"
                aria-label={t("delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}