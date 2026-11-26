"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type LayoutEditContextType = {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
};

const LayoutEditContext = createContext<LayoutEditContextType>({
  editMode: false,
  setEditMode: () => {},
});

export function LayoutEditProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  return (
    <LayoutEditContext.Provider value={{ editMode, setEditMode }}>
      {children}
    </LayoutEditContext.Provider>
  );
}

export function useLayoutEdit() {
  return useContext(LayoutEditContext);
}
