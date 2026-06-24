"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchDepartments, fetchOfficers } from "@/lib/actions/data";

export type CatalogDepartment = {
  id: string;
  name: string;
  shortName: string | null;
};

export type CatalogOfficer = {
  id: string;
  name: string;
  username: string;
  departmentId: string;
  departmentName: string;
};

interface CatalogContextValue {
  departments: CatalogDepartment[];
  officers: CatalogOfficer[];
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<CatalogDepartment[]>([]);
  const [officers, setOfficers] = useState<CatalogOfficer[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchDepartments(), fetchOfficers()]).then(([depts, offs]) => {
      if (cancelled) return;
      setDepartments(depts);
      setOfficers(offs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ departments, officers }), [departments, officers]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
