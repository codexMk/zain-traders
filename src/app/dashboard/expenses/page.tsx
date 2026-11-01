"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowDownRight,
  CalendarDays,
  Check,
  CircleDollarSign,
  FileText,
  LoaderCircle,
  Plus,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";

type Expense = {
  id: string;
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
  notes: string | null;
};

type ExpenseSummary = {
  expenses: Expense[];
  monthTotal: number;
  monthCount: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function isExpenseSummary(value: unknown): value is ExpenseSummary {
  return isRecord(value) &&
    Array.isArray(value.expenses) &&
    value.expenses.every((expense) =>
      isRecord(expense) &&
      typeof expense.id === "string" &&
      typeof expense.category === "string" &&
      typeof expense.amount === "number" &&
      typeof expense.description === "string" &&
      typeof expense.expenseDate === "string" &&
      (typeof expense.notes === "string" || expense.notes === null),
    ) &&
    typeof value.monthTotal === "number" &&
    typeof value.monthCount === "number";
}

function businessToday() {
  return new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);
}

function apiErrorMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.error === "string" ? value.error : fallback;
}

const categories = [
  "Rent",
  "Utilities",
  "Salaries",
  "Transport",
  "Packaging",
  "Repairs & maintenance",
  "Marketing",
  "Office supplies",
  "Other",
];

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const canManage = session?.user?.role === "OWNER" || session?.user?.role === "ACCOUNTANT";
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [notes, setNotes] = useState("");

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/expenses", { cache: "no-store" });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(apiErrorMessage(data, "Could not load expenses"));
      if (!isExpenseSummary(data)) throw new Error("The server returned an unexpected expense response");
      setExpenses(data.expenses);
      setMonthTotal(data.monthTotal);
      setMonthCount(data.monthCount);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load expenses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setExpenseDate(businessToday());
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!canManage) {
      setIsLoading(false);
      return;
    }
    void loadExpenses();
  }, [canManage, loadExpenses, status]);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return expenses;
    return expenses.filter((expense) =>
      `${expense.description} ${expense.category} ${expense.notes ?? ""}`.toLocaleLowerCase().includes(query),
    );
  }, [expenses, search]);

  const monthName = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const addExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const dateAtBusinessMidnight = new Date(`${expenseDate}T00:00:00+05:30`).toISOString();
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category.trim(),
          amount: Number(amount),
          description: description.trim(),
          expenseDate: dateAtBusinessMidnight,
          notes: notes.trim() || undefined,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(apiErrorMessage(result, "Could not save this expense"));

      setCategory("");
      setAmount("");
      setDescription("");
      setNotes("");
      setExpenseDate(businessToday());
      setSuccess("Expense saved and added to the ledger.");
      await loadExpenses();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this expense");
    } finally {
      setIsSaving(false);
    }
  };

  if (status !== "loading" && !canManage) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <ReceiptText className="mx-auto size-12 text-amber-600" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Expenses are restricted</h1>
        <p className="mt-2 text-gray-600">Only the owner and accountant can view or record business expenses.</p>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#103f30_0%,#176044_65%,#1b7353_100%)] p-5 text-white shadow-lg shadow-emerald-950/10 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-16 size-64 rounded-full border-[32px] border-white/[0.05]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-40 size-48 rounded-full bg-amber-300/[0.08] blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
              <Wallet size={14} className="text-amber-300" /> Business finance
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Expenses tracker</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-emerald-50/80 sm:text-base">
              Record day-to-day costs and keep each expense connected to your business ledger.
            </p>
          </div>
          <a href="#add-expense" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-bold text-emerald-950 shadow-sm transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-800">
            <Plus size={18} /> Record expense
          </a>
        </div>
      </section>

      {error && <div role="alert" className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span>{!isLoading && <button type="button" onClick={() => void loadExpenses()} className="shrink-0 font-semibold underline">Retry</button>}</div>}
      {success && <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><Check size={17} />{success}</div>}

      <section aria-label={`${monthName} expense summary`} className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-600">Spent in {monthName}</p>
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CircleDollarSign size={20} /></span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-gray-950">{isLoading ? "—" : formatCurrency(monthTotal)}</p>
          <p className="mt-1 text-xs text-gray-500">All recorded expenses this month</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-600">Entries this month</p>
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><ReceiptText size={20} /></span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-gray-950">{isLoading ? "—" : monthCount}</p>
          <p className="mt-1 text-xs text-gray-500">Expense records added to the ledger</p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-600">Average expense</p>
            <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><ArrowDownRight size={20} /></span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-gray-950">{isLoading ? "—" : formatCurrency(monthCount ? monthTotal / monthCount : 0)}</p>
          <p className="mt-1 text-xs text-gray-500">Monthly spend divided by entries</p>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.5fr)]">
        <section id="add-expense" className="scroll-mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Plus size={20} /></span>
            <div>
              <h2 className="font-bold text-gray-950">Record an expense</h2>
              <p className="mt-1 text-sm text-gray-500">Add the amount and a short description.</p>
            </div>
          </div>
          <form onSubmit={addExpense} className="space-y-4">
            <div>
              <label htmlFor="expense-category" className="mb-1.5 block text-sm font-semibold text-gray-700">Category</label>
              <input id="expense-category" list="expense-categories" value={category} onChange={(event) => setCategory(event.target.value)} required maxLength={80} placeholder="e.g. Transport" className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" />
              <datalist id="expense-categories">{categories.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="expense-amount" className="mb-1.5 block text-sm font-semibold text-gray-700">Amount (₹)</label>
                <input id="expense-amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} required min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" className="min-h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" />
              </div>
              <div>
                <label htmlFor="expense-date" className="mb-1.5 block text-sm font-semibold text-gray-700">Date</label>
                <div className="relative">
                  <CalendarDays size={16} className="pointer-events-none absolute left-3 top-3.5 text-gray-400" />
                  <input id="expense-date" type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} required className="min-h-11 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="expense-description" className="mb-1.5 block text-sm font-semibold text-gray-700">Description</label>
              <input id="expense-description" value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={180} placeholder="What was this expense for?" className="min-h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" />
            </div>
            <div>
              <label htmlFor="expense-notes" className="mb-1.5 block text-sm font-semibold text-gray-700">Notes <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea id="expense-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={500} placeholder="Add a receipt reference or extra details" className="w-full resize-y rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" />
            </div>
            <button type="submit" disabled={isSaving || !expenseDate} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={18} />}
              {isSaving ? "Saving expense…" : "Save expense"}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-500"><FileText size={13} />Saving also creates an expense ledger entry.</p>
          </form>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-bold text-gray-950">Recent expenses</h2>
              <p className="mt-1 text-sm text-gray-500">Your latest 20 expense records</p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Search recent expenses</span>
              <Search size={17} className="pointer-events-none absolute left-3 top-3 text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expenses" className="min-h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10" />
            </label>
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-gray-500"><LoaderCircle className="animate-spin text-emerald-700" size={18} />Loading expenses…</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ReceiptText size={25} /></span>
              <h3 className="mt-4 font-semibold text-gray-900">{search ? "No matching expenses" : "No expenses recorded yet"}</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">{search ? "Try a different description or category." : "Your saved expenses will appear here, with the newest entries first."}</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                    <tr><th className="px-5 py-3 font-semibold">Expense</th><th className="px-4 py-3 font-semibold">Category</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-5 py-3 text-right font-semibold">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="transition hover:bg-emerald-50/40">
                        <td className="max-w-[240px] px-5 py-4"><p className="truncate font-semibold text-gray-900">{expense.description}</p>{expense.notes && <p className="mt-1 truncate text-xs text-gray-500">{expense.notes}</p>}</td>
                        <td className="px-4 py-4"><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{expense.category}</span></td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-600">{new Date(expense.expenseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums text-gray-900">{formatCurrency(expense.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-gray-100 md:hidden">
                {filteredExpenses.map((expense) => (
                  <li key={expense.id} className="flex items-start justify-between gap-3 px-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{expense.description}</p>
                      <p className="mt-1 text-xs text-gray-500">{expense.category} <span className="px-1">·</span>{new Date(expense.expenseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</p>
                      {expense.notes && <p className="mt-1 truncate text-xs text-gray-500">{expense.notes}</p>}
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-gray-900">{formatCurrency(expense.amount)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!isLoading && expenses.length > 0 && <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">Showing {filteredExpenses.length} of {expenses.length} recent entries</p>}
        </section>
      </div>
    </div>
  );
}
