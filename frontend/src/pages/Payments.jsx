import React, { useEffect, useState } from 'react';
import { CreditCard, Loader, Plus } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const emptyForm = { invoiceId: '', amount: '', paymentDate: '', method: 'CASH', status: 'PAID', reference: '', notes: '' };

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([api.get('/payments'), api.get('/invoices')]);
      setPayments(paymentsRes.data || []);
      setInvoices(invoicesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    await api.post('/payments', { ...form, amount: Number(form.amount || 0) });
    setForm(emptyForm);
    fetchData();
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-display">Règlements</h1>
        <p className="text-sm text-slate-500 font-medium">Suivez les paiements client sans connecter encore Flouci, ClickToPay ou TunPay.</p>
      </div>

      <Card title="Ajouter un règlement" icon={Plus}>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select required className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" value={form.invoiceId} onChange={(event) => setForm({ ...form, invoiceId: event.target.value })}>
            <option value="">Facture</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber || invoice.number || invoice.id.slice(0, 8)} · {invoice.client?.name || 'Client'}</option>
            ))}
          </select>
          <input required className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" type="number" step="0.001" placeholder="Montant" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" type="date" value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value })} />
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
            {['CASH', 'BANK_TRANSFER', 'CHEQUE', 'FLOUCI', 'CLICKTOPAY', 'TUNPAY', 'OTHER'].map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {['PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'CANCELLED'].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Reference" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
          <textarea className="md:col-span-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <div className="md:col-span-3">
            <Button type="submit">Enregistrer le règlement</Button>
          </div>
        </form>
      </Card>

      <Card title="Historique des règlements" icon={CreditCard} noPadding>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400 font-semibold">Aucun règlement enregistré.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <div key={payment.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={payment.status === 'PAID' ? 'success' : payment.status === 'FAILED' ? 'rejected' : 'warning'}>{payment.status}</Badge>
                    <span className="text-xs text-slate-400 font-black">{payment.method}</span>
                  </div>
                  <p className="text-sm font-black text-slate-900">{Number(payment.amount || 0).toFixed(3)} TND</p>
                  <p className="text-xs text-slate-500">{payment.invoice?.number || payment.invoiceId} · {payment.invoice?.client?.name || 'Client'}</p>
                </div>
                <div className="text-xs font-bold text-slate-500">{new Date(payment.paymentDate).toLocaleDateString('fr-TN')}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Payments;

