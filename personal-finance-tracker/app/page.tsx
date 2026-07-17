'use client';

import { useEffect, useState } from 'react';
// Import directly from the core package to avoid path resolution errors
import { createBrowserClient } from '@supabase/ssr';

// Define the schema profile locally
interface Transaction {
  id: number;
  user_id: string;
  date: string;
  type: 'income' | 'expense';
  description: string;
  category: string;
  amount: number;
  payment_mode: string;
  remarks?: string;
}

export default function FinanceDashboard() {
  // Initialize inline using your absolute system environment keys
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Input States
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Food');
  const [paymentMode, setPaymentMode] = useState('Card');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    async function fetchTransactions() {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) console.error('Error fetching:', error.message);
      else if (data) setTransactions(data);
      setLoading(false);
    }
    fetchTransactions();
  }, []); // Handled natively without external variable triggers

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newRow = {
      description,
      amount: parseFloat(amount),
      type,
      category,
      payment_mode: paymentMode,
      remarks: remarks || null,
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([newRow])
      .select();

    if (error) {
      alert(`Error saving transaction: ${error.message}`);
    } else if (data) {
      setTransactions([data[0], ...transactions]);
      setDescription('');
      setAmount('');
      setRemarks('');
    }
  };

  // Math Layer Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const remainingBalance = totalIncome - totalExpense;

  const categoryMap = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
      return acc;
    }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading ledger records...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen text-slate-900">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledger Engine</h1>
          <p className="text-slate-500 text-sm">Real-time dynamic balance & categorization tracker</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm min-w-[240px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Remaining Liquidity</p>
          <p className={`text-3xl font-extrabold tracking-tight ${remainingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${remainingBalance.toFixed(2)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4 tracking-tight border-b pb-2">Record Transaction</h2>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                    type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Expense (-)
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                    type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Income (+)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., AWS Subscription, Salary"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                >
                  <option value="Food">Food</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Transport">Transport</option>
                  <option value="Salary">Salary</option>
                  <option value="Investments">Investments</option>
                  <option value="Leisure">Leisure</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="Card">Credit/Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Remarks (Optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Additional details..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold tracking-wide transition-all shadow-sm"
            >
              Commit Transaction
            </button>
          </form>
        </section>

        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 tracking-tight border-b pb-2">Expense Allocation by Category</h2>
            {sortedCategories.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No expenses recorded yet to map allocation profiles.</p>
            ) : (
              <div className="space-y-4">
                {sortedCategories.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>{cat.name}</span>
                      <span className="text-slate-600">${cat.value.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{
                          width: `${Math.min((cat.value / (totalExpense || 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden">
            <h2 className="text-xl font-bold mb-4 tracking-tight border-b pb-2">Transaction Feed</h2>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase font-bold text-slate-400">
                    <th className="pb-3 pt-1">Date</th>
                    <th className="pb-3 pt-1">Description</th>
                    <th className="pb-3 pt-1">Category</th>
                    <th className="pb-3 pt-1">Method</th>
                    <th className="pb-3 pt-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No transactions logged for this account lifecycle.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-all">
                        <td className="py-3 text-slate-500 whitespace-nowrap">{tx.date}</td>
                        <td className="py-3 font-semibold">
                          <div>{tx.description}</div>
                          {tx.remarks && <div className="text-xs font-normal text-slate-400 mt-0.5">{tx.remarks}</div>}
                        </td>
                        <td className="py-3">
                          <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 font-medium">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 text-xs">{tx.payment_mode}</td>
                        <td className={`py-3 text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}