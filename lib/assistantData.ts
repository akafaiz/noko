"use client";

import { useSyncExternalStore } from "react";

export type Todo = { id: string; text: string; done: boolean };
export type Agenda = Record<string, string[]>;
export type Reminder = {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
  notify: boolean;
};
export type RingtoneKey = "chime" | "beep" | "bell" | "radar";
export type Alarm = {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  ringtone: RingtoneKey;
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

function createStore<T>(key: string, initial: T) {
  const EVENT = `${key}-change`;
  let cache: T = initial;
  let loaded = false;

  const load = (): T => {
    if (loaded || typeof window === "undefined") return cache;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) cache = JSON.parse(raw) as T;
    } catch {
      /* ignore corrupt storage */
    }
    return cache;
  };

  const subscribe = (cb: () => void) => {
    const handler = () => cb();
    window.addEventListener("storage", handler);
    window.addEventListener(EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(EVENT, handler);
    };
  };

  const getServer = () => initial;

  const set = (next: T) => {
    cache = next;
    loaded = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return {
    useStore: () => useSyncExternalStore(subscribe, load, getServer),
    get: load,
    set,
  };
}

const todos = createStore<Todo[]>("noko_todos", []);
const agenda = createStore<Agenda>("noko_agenda", {});
const reminders = createStore<Reminder[]>("noko_reminders", []);
const alarms = createStore<Alarm[]>("noko_alarms", []);

export const useTodos = todos.useStore;
export const getTodos = todos.get;
export const setTodos = todos.set;

export const useAgenda = agenda.useStore;
export const getAgenda = agenda.get;
export const setAgenda = agenda.set;

export const useReminders = reminders.useStore;
export const getReminders = reminders.get;
export const setReminders = reminders.set;

export const useAlarms = alarms.useStore;
export const getAlarms = alarms.get;
export const setAlarms = alarms.set;

export function addAgendaItem(key: string, text: string) {
  const cur = getAgenda();
  const list = cur[key] ?? [];
  if (list.includes(text)) return;
  setAgenda({ ...cur, [key]: [...list, text] });
}

export type Product = { id: string; name: string; modal: number; jual: number };

const products = createStore<Product[]>("noko_products", [
  { id: "p1", name: "Kopi Latte", modal: 8000, jual: 18000 },
  { id: "p2", name: "Croissant", modal: 6000, jual: 15000 },
  { id: "p3", name: "Sandwich", modal: 12000, jual: 22000 },
]);
const pin = createStore<string>("noko_pin", "1234");

export const useProducts = products.useStore;
export const getProducts = products.get;
export const setProducts = products.set;

export const usePin = pin.useStore;
export const getPin = pin.get;
export const setPin = pin.set;

const ONBOARD_KEY = "noko_onboarding_pending";

export function setOnboardingPending(value: boolean) {
  try {
    if (value) window.localStorage.setItem(ONBOARD_KEY, "1");
    else window.localStorage.removeItem(ONBOARD_KEY);
  } catch {
    /* ignore */
  }
}

export function isOnboardingPending(): boolean {
  try {
    return window.localStorage.getItem(ONBOARD_KEY) === "1";
  } catch {
    return false;
  }
}