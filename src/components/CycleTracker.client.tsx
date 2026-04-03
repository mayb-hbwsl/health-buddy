"use client";

import React, { useState } from "react";
import { savePeriodDate } from "@/app/actions/cycle";
import { useRouter } from "next/navigation";
import styles from "./CycleTracker.module.css";

interface CycleTrackerProps {
  lastPeriodDate: string | null;
  cycleLength: number | null;
}

function computeCycleInfo(lastPeriodDate: string | null, cycleLength: number) {
  if (!lastPeriodDate) return null;

  const last = new Date(lastPeriodDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);

  const nextPeriod = new Date(last);
  nextPeriod.setDate(nextPeriod.getDate() + cycleLength);

  const daysUntil = Math.round(
    (nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const ovulation = new Date(last);
  ovulation.setDate(ovulation.getDate() + Math.round(cycleLength / 2) - 1);

  const cycleDay = Math.round(
    (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return {
    nextPeriod: nextPeriod.toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    }),
    daysUntil,
    ovulation: ovulation.toLocaleDateString("en-IN", {
      day: "numeric", month: "short"
    }),
    cycleDay: Math.min(cycleDay, cycleLength),
    cycleLength,
    isOverdue: daysUntil < 0,
  };
}

export default function CycleTracker({ lastPeriodDate, cycleLength }: CycleTrackerProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cycle = cycleLength || 28;
  const info = computeCycleInfo(lastPeriodDate, cycle);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const res = await savePeriodDate(formData);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setShowForm(false);
      router.refresh();
    }
  };

  if (showForm) {
    return (
      <div className={styles.formContainer}>
        <p className={styles.formTitle}>Log Your Period</p>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>First Day of Last Period</label>
            <input
              name="lastPeriodDate"
              type="date"
              className={styles.input}
              defaultValue={lastPeriodDate || new Date().toISOString().split("T")[0]}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Average Cycle Length (days)</label>
            <input
              name="cycleLength"
              type="number"
              className={styles.input}
              defaultValue={cycle}
              min={21}
              max={45}
            />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (!info) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Track your menstrual cycle to predict your next period.</p>
        <button className={styles.logBtn} onClick={() => setShowForm(true)}>
          + Log Period Date
        </button>
      </div>
    );
  }

  return (
    <div className={styles.cycleInfo}>
      {/* Progress ring / timeline */}
      <div className={styles.timeline}>
        <div
          className={styles.timelineBar}
          style={{ width: `${Math.min((info.cycleDay / info.cycleLength) * 100, 100)}%` }}
        />
      </div>
      <p className={styles.cycleDay}>Day {info.cycleDay} of {info.cycleLength}</p>

      <div className={styles.infoRows}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>🩸 Next Period</span>
          <span className={styles.infoValue}>{info.nextPeriod}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>📅 Days Away</span>
          <span className={`${styles.infoValue} ${info.isOverdue ? styles.overdue : (info.daysUntil <= 3 ? styles.soon : "")}`}>
            {info.isOverdue ? `${Math.abs(info.daysUntil)}d overdue` : `${info.daysUntil} days`}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>🌸 Est. Ovulation</span>
          <span className={styles.infoValue}>{info.ovulation}</span>
        </div>
      </div>

      <button className={styles.updateBtn} onClick={() => setShowForm(true)}>
        Update Period Date
      </button>
    </div>
  );
}
