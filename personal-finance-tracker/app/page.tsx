'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

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

  const expenseCategories = ['Food', 'Transport', 'Family', 'Drink', 'Other'];
  const incomeCategories = ['Pocket money', 'Other'];

  useEffect(() => {
    setCategory(type === 'expense' ? expenseCategories[0] : incomeCategories[0]);
  }, [type]);

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
  }, []);

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

  // Math Vectors for rendering the SVG Pie Chart natively
  let cumulativePercent = 0;
  const pieRadius = 25;
  const pieCircumference = 2 * Math.PI * pieRadius;
  
  const chartColors = ['#f43f5e', '#38bdf8', '#fbbf24', '#a855f7', '#34d399', '#94a3b8'];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-2">
        <div className="w-6 h-6 border-2 border-t-transparent border-amber-500 rounded-full animate-spin"></div>
        <p className="text-sm font-medium animate-pulse">Loading ledger records...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Profile Workspace */}
      <header className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b pb-6 border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Finance tracker
          </h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl min-w-[240px]">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Balance</p>
          <p className={`text-3xl font-black tracking-tight ${remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            RM {remainingBalance.toFixed(2)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Record Transaction Panel Form */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit space-y-4">
          <h2 className="text-xl font-bold tracking-tight border-b pb-2 border-slate-800">Log Transaction</h2>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-inner' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Item Name / Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-800 rounded-xl text-sm bg-slate-950 text-slate-100 focus:outline-none focus:border-slate-600 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Amount (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-800 rounded-xl text-sm bg-slate-950 text-slate-100 focus:outline-none focus:border-slate-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Category Allocation</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 rounded-xl text-sm bg-slate-950 text-slate-100 focus:outline-none focus:border-slate-600 transition-all cursor-pointer"
                >
                  {type === 'expense'
                    ? expenseCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)
                    : incomeCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Remarks (Optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-800 rounded-xl text-sm bg-slate-950 text-slate-100 focus:outline-none focus:border-slate-600 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg"
            >
              Save
            </button>
          </form>
        </section>

        {/* Analytics Workspace Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Native SVG Interactive Pie Chart Rendering */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 tracking-tight border-b pb-2 border-slate-800">Expense Distribution</h2>
            {sortedCategories.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No transactional metrics found matching this context parameters.</p>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8 justify-around">
                {/* SVG Radial Engine Container */}
                <div className="relative w-44 h-44">
                  <svg viewBox="0 0 64 64" className="w-full h-full transform -rotate-90">
                    {sortedCategories.map((cat, index) => {
                      const percentage = cat.value / (totalExpense || 1);
                      const strokeDasharray = `${percentage * pieCircumference} ${pieCircumference}`;
                      const strokeDashoffset = -cumulativePercent * pieCircumference;
                      cumulativePercent += percentage;
                      const activeColor = chartColors[index % chartColors.length];

                      return (
                        <circle
                          key={cat.name}
                          cx="32"
                          cy="32"
                          r={pieRadius}
                          fill="transparent"
                          stroke={activeColor}
                          strokeWidth="10"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:stroke-[12px] cursor-pointer"
                        />
                      );
                    })}
                  </svg>
                  {/* Central balance cutout block (Transforms Pie -> Donut metric) */}
                  <div className="absolute inset-0 m-auto w-24 h-24 bg-slate-900 rounded-full flex flex-col items-center justify-center border border-slate-800/60 shadow-inner">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                    <span className="text-sm font-extrabold text-slate-100">RM {totalExpense.toFixed(2)}</span>
                  </div>
                </div>

                {/* Structured Dynamic Color Legend Index Matrix */}
                <div className="flex-1 w-full space-y-3">
                  {sortedCategories.map((cat, index) => {
                    const activeColor = chartColors[index % chartColors.length];
                    const sharePercent = ((cat.value / (totalExpense || 1)) * 100).toFixed(1);
                    return (
                      <div key={cat.name} className="flex items-center justify-between text-sm bg-slate-950/40 border border-slate-800/40 p-2 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeColor }} />
                          <span className="font-medium text-slate-200">{cat.name}</span>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="font-bold text-slate-100">RM {cat.value.toFixed(2)}</span>
                          <span className="text-xs text-slate-500 ml-2 font-medium">({sharePercent}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Core Unified Log Records Table Panel */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden">
            <h2 className="text-xl font-bold mb-4 tracking-tight border-b pb-2 border-slate-800">Transactions</h2>
            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="pb-3 pt-1">Date</th>
                    <th className="pb-3 pt-1">Description</th>
                    <th className="pb-3 pt-1">Category</th>
                    <th className="pb-3 pt-1">Method</th>
                    <th className="pb-3 pt-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {transactions.length === 0 ? (
                    <tr>
                      
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="py-3 text-slate-400 text-xs whitespace-nowrap">{tx.date}</td>
                        <td className="py-3 font-medium text-slate-200">
                          <div>{tx.description}</div>
                          {tx.remarks && <div className="text-xs font-normal text-slate-500 italic mt-0.5">{tx.remarks}</div>}
                        </td>
                        <td className="py-3">
                          <span className="inline-block bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-lg text-xs font-medium">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 text-xs whitespace-nowrap">{tx.payment_mode}</td>
                        <td className={`py-3 text-right font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {tx.type === 'income' ? '+' : '-'}RM {Number(tx.amount).toFixed(2)}
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