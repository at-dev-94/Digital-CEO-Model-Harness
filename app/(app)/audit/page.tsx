"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/Providers";

type Row = { id: string; action: string; entity: string; detail: string; createdAt: string };

export default function AuditPage() {
  const { t } = useApp();
  const [items, setItems] = useState<Row[]>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/audit");
      if (res.ok) setItems((await res.json()).items || []);
    })();
  }, []);
  return (
    <div className="panel overflow-x-auto rounded-2xl">
      <table className="min-w-full text-sm">
        <thead className="soft text-left text-[var(--muted)]">
          <tr>
            <th className="p-3">When</th>
            <th className="p-3">Action</th>
            <th className="p-3">Entity</th>
            <th className="p-3">Detail</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-t border-[var(--line)]">
              <td className="p-3 whitespace-nowrap text-[var(--muted)]">{new Date(i.createdAt).toLocaleString()}</td>
              <td className="p-3">{i.action}</td>
              <td className="p-3">{i.entity}</td>
              <td className="p-3">{i.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 ? <p className="p-6 text-[var(--muted)]">{t("noItems")}</p> : null}
    </div>
  );
}
