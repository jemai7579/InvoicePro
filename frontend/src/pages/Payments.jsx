import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Edit3, Loader, Plus, Trash2, XCircle } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const emptyForm = { invoiceId: '', amount: '', paymentDate: '', method: 'CASH', status: 'PAID', reference: '', notes: '' };

const statusLabels = {
  PENDING: 'Non payé',
  PARTIALLY_PAID: 'Partiellement payé',
  PAID: 'Payé',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulé',
  FAILED: 'En retard',
  UNPAID: 'Non payé',
};

const statusVariant = (status) => {
  if (status === 'PAID') return 'success';
  if (['CANCELLED', 'FAILED'].includes(status)) return 'rejected';
  if (status === 'PARTIALLY_PAID') return 'primary';
  return 'warning';
};

const getInvoiceTotal = (invoice) => Number(invoice?.netToPay ?? invoice?.totalTTC ?? 0);
const parseAmountInput = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const normalized = String(value).trim().replace(',', '.');
  if (!/^\d*(\.\d{0,3})?$/.test(normalized)) return NaN;
  return Number(normalized || 0);
};
const formatMoney = (value) => Number(value || 0).toFixed(3);

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([api.get('/payments'), api.get('/invoices')]);
      setPayments(paymentsRes.data || []);
      setInvoices(invoicesRes.data || []);
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Impossible de charger les règlements.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const invoiceSummaries = useMemo(() => {
    return invoices.map((invoice) => {
      const invoicePayments = payments.filter((payment) => payment.invoiceId === invoice.id);
      const totalPaid = invoicePayments
        .filter((payment) => ['PAID', 'PARTIALLY_PAID'].includes(payment.status))
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const invoiceTotal = getInvoiceTotal(invoice);
      const remaining = Math.max(0, invoiceTotal - totalPaid);
      const paymentStatus = totalPaid <= 0 ? 'UNPAID' : remaining <= 0 ? 'PAID' : 'PARTIALLY_PAID';
      return { invoice, totalPaid, invoiceTotal, remaining, paymentStatus };
    });
  }, [invoices, payments]);

  const selectedSummary = invoiceSummaries.find((summary) => summary.invoice.id === form.invoiceId);
  const parsedAmount = parseAmountInput(form.amount);
  const amountIsInvalid = form.amount !== '' && Number.isNaN(parsedAmount);
  const newPaymentAmount = amountIsInvalid ? 0 : parsedAmount;
  const editingPayment = editingId ? payments.find((payment) => payment.id === editingId) : null;
  const editingPaymentWasCounted = editingPayment && ['PAID', 'PARTIALLY_PAID'].includes(editingPayment.status);
  const alreadyPaidBeforeThisPayment = Math.max(
    0,
    (selectedSummary?.totalPaid ?? 0) - (editingPaymentWasCounted ? Number(editingPayment.amount || 0) : 0)
  );
  const remainingBeforePayment = selectedSummary
    ? Math.max(0, selectedSummary.invoiceTotal - alreadyPaidBeforeThisPayment)
    : 0;
  const remainingAfterPayment = selectedSummary
    ? Math.max(0, selectedSummary.invoiceTotal - alreadyPaidBeforeThisPayment - newPaymentAmount)
    : 0;
  const amountExceedsRemaining = selectedSummary && newPaymentAmount > remainingBeforePayment;
  const suggestedStatus = selectedSummary
    ? remainingAfterPayment <= 0 && newPaymentAmount > 0
      ? 'PAID'
      : newPaymentAmount > 0
        ? 'PARTIALLY_PAID'
        : form.status
    : form.status;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);
    try {
      const amount = parseAmountInput(form.amount);
      if (!form.invoiceId) throw new Error('Veuillez sélectionner une facture.');
      if (Number.isNaN(amount) || amount <= 0) throw new Error('Veuillez saisir un montant valide.');
      const payload = { ...form, amount, status: form.status || suggestedStatus };
      if (editingId) {
        await api.put(`/payments/${editingId}`, payload);
        setNotice({ type: 'success', text: 'Règlement mis à jour avec succès.' });
      } else {
        await api.post('/payments', payload);
        setNotice({ type: 'success', text: 'Règlement enregistré avec succès.' });
      }
      resetForm();
      await fetchData();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || error.message || 'Impossible d’enregistrer le règlement.' });
    } finally {
      setSubmitting(false);
    }
  };

  const editPayment = (payment) => {
    setEditingId(payment.id);
    setForm({
      invoiceId: payment.invoiceId || '',
      amount: payment.amount || '',
      paymentDate: payment.paymentDate ? payment.paymentDate.slice(0, 10) : '',
      method: payment.method || 'CASH',
      status: payment.status || 'PAID',
      reference: payment.reference || '',
      notes: payment.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mutatePayment = async (payment, patch, successText) => {
    setBusyId(payment.id);
    setNotice(null);
    try {
      await api.put(`/payments/${payment.id}`, patch);
      setNotice({ type: 'success', text: successText });
      await fetchData();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Action impossible sur ce règlement.' });
    } finally {
      setBusyId(null);
    }
  };

  const deletePayment = async (payment) => {
    if (!window.confirm('Supprimer ce règlement ? L’historique d’audit restera conservé.')) return;
    setBusyId(payment.id);
    setNotice(null);
    try {
      await api.delete(`/payments/${payment.id}`);
      setNotice({ type: 'success', text: 'Règlement supprimé avec succès.' });
      await fetchData();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Impossible de supprimer ce règlement.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 pb-20 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-display">Règlements</h1>
        <p className="text-sm text-slate-500 font-medium">Un règlement intervient après la facture. Il sert à suivre si le client a payé, combien il a payé, et combien reste à payer.</p>
      </div>

      <Card>
        <div className="space-y-4">
          <p className="text-sm font-bold text-slate-700 leading-6">
            Les règlements servent à suivre l’argent reçu après l’émission d’une facture. Une offre ou un bon de commande sert à proposer un travail avant facturation. Un règlement sert à confirmer qu’une facture est payée, partiellement payée ou encore en attente.
          </p>
          <div className="flex flex-wrap gap-2">
            {['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].map((status) => (
              <Badge key={status} variant={statusVariant(status)}>{statusLabels[status]}</Badge>
            ))}
          </div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Offre → Devis → Facture → Règlement</div>
        </div>
      </Card>

      {notice ? (
        <div className={`rounded-2xl px-5 py-4 text-sm font-bold ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          {notice.text}
        </div>
      ) : null}

      <Card title={editingId ? 'Modifier un règlement' : 'Ajouter un règlement'} icon={Plus}>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select required disabled={Boolean(editingId)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold disabled:bg-slate-50 disabled:text-slate-400" value={form.invoiceId} onChange={(event) => setForm({ ...form, invoiceId: event.target.value })}>
            <option value="">Facture</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber || invoice.number || invoice.id.slice(0, 8)} · {invoice.client?.name || 'Client'} · {getInvoiceTotal(invoice).toFixed(3)} TND</option>
            ))}
          </select>
          <div className="space-y-2">
            <input
              required
              className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold ${amountIsInvalid ? 'border-rose-200 bg-rose-50' : 'border-slate-200'}`}
              inputMode="decimal"
              placeholder="Montant reçu / payé maintenant"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
            <p className="text-xs font-semibold text-slate-500 leading-5">
              Indiquez le montant que vous venez de recevoir pour cette facture. Le total payé et le reste seront calculés automatiquement.
            </p>
          </div>
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" type="date" value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value })} />
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
            {['CASH', 'BANK_TRANSFER', 'CHEQUE', 'FLOUCI', 'CLICKTOPAY', 'TUNPAY', 'OTHER'].map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="PENDING">Non payé</option>
            <option value="PARTIALLY_PAID">Partiellement payé</option>
            <option value="PAID">Payé</option>
            <option value="FAILED">En retard</option>
            <option value="CANCELLED">Annulé</option>
          </select>
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Référence" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
          <textarea className="md:col-span-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          {selectedSummary ? (
            <div className="md:col-span-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total facture</div>
                  <div className="mt-1 text-sm font-black text-slate-900">{formatMoney(selectedSummary.invoiceTotal)} TND</div>
                </div>
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-500">Déjà payé</div>
                  <div className="mt-1 text-sm font-black text-blue-800">{formatMoney(alreadyPaidBeforeThisPayment)} TND</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Nouveau paiement</div>
                  <div className="mt-1 text-sm font-black text-emerald-700">{formatMoney(newPaymentAmount)} TND</div>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-500">Reste après ce paiement</div>
                  <div className="mt-1 text-sm font-black text-amber-700">{formatMoney(remainingAfterPayment)} TND</div>
                </div>
              </div>
              {amountExceedsRemaining ? (
                <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs font-bold text-amber-700">
                  Le montant saisi dépasse le reste à payer.
                </div>
              ) : null}
              {newPaymentAmount > 0 ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs font-bold text-slate-600">
                  Suggestion: {suggestedStatus === 'PAID' ? 'Payé' : 'Partiellement payé'}. Vous pouvez garder ou modifier le statut avant d’enregistrer.
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-col gap-3 min-[375px]:flex-row md:col-span-3">
            <Button type="submit" className="w-full min-[375px]:w-auto" loading={submitting} disabled={submitting || amountIsInvalid}>{editingId ? 'Enregistrer les modifications' : 'Enregistrer le règlement'}</Button>
            {editingId ? <Button type="button" className="w-full min-[375px]:w-auto" variant="secondary" onClick={resetForm}>Annuler</Button> : null}
          </div>
        </form>
      </Card>

      <Card title="Résumé par facture" icon={CheckCircle2} noPadding>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : invoiceSummaries.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 font-semibold">Aucune facture disponible pour enregistrer un règlement.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {invoiceSummaries.slice(0, 6).map(({ invoice, totalPaid, invoiceTotal, remaining, paymentStatus }) => (
              <div key={invoice.id} className="flex flex-col justify-between gap-3 p-4 sm:p-5 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-black text-slate-400">{invoice.invoiceNumber || invoice.number || invoice.id.slice(0, 8)}</span>
                    <Badge variant={statusVariant(paymentStatus)}>{statusLabels[paymentStatus]}</Badge>
                  </div>
                  <p className="text-sm font-black text-slate-900">{invoice.client?.name || 'Client'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Total facture: {formatMoney(invoiceTotal)} TND · Déjà payé: {formatMoney(totalPaid)} TND · Reste à payer: {formatMoney(remaining)} TND
                  </p>
                </div>
                <Button className="w-full lg:w-auto" size="sm" variant="secondary" onClick={() => setForm({ ...emptyForm, invoiceId: invoice.id, amount: remaining > 0 ? formatMoney(remaining) : '' })}>
                  {paymentStatus === 'PAID' ? 'Voir règlements' : 'Ajouter un règlement'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Historique des règlements" icon={CreditCard} noPadding>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400 font-semibold">Aucun règlement enregistré.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <div key={payment.id} className="flex flex-col justify-between gap-3 p-4 sm:p-5 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={statusVariant(payment.status)}>{statusLabels[payment.status] || payment.status}</Badge>
                    <span className="text-xs text-slate-400 font-black">{payment.method}</span>
                  </div>
                  <p className="text-sm font-black text-slate-900">{Number(payment.amount || 0).toFixed(3)} TND</p>
                  <p className="text-xs text-slate-500">{payment.invoice?.number || payment.invoiceId} · {payment.invoice?.client?.name || 'Client'} · {new Date(payment.paymentDate).toLocaleDateString('fr-TN')}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Button className="w-full sm:w-auto" size="sm" variant="secondary" icon={Edit3} onClick={() => editPayment(payment)}>Modifier</Button>
                  <Button className="w-full sm:w-auto" size="sm" icon={CheckCircle2} loading={busyId === payment.id} onClick={() => mutatePayment(payment, { status: 'PAID' }, 'Règlement marqué comme payé.')}>Marquer payé</Button>
                  <Button className="w-full sm:w-auto" size="sm" variant="secondary" loading={busyId === payment.id} onClick={() => mutatePayment(payment, { status: 'PARTIALLY_PAID' }, 'Règlement marqué comme partiel.')}>Partiel</Button>
                  <Button className="w-full sm:w-auto" size="sm" variant="secondary" icon={XCircle} loading={busyId === payment.id} onClick={() => mutatePayment(payment, { status: 'CANCELLED' }, 'Règlement annulé.')}>Annuler</Button>
                  <Button className="col-span-2 w-full sm:w-auto" size="sm" variant="ghost" icon={Trash2} loading={busyId === payment.id} onClick={() => deletePayment(payment)}>Supprimer</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Payments;
