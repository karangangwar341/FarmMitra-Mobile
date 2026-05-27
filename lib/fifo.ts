export interface EntryMini {
  id: string;
  totalAmount: number;
  remainingAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | string;
  date: Date | string;
}

export interface PaymentAllocationResult {
  entryId: string;
  amountAllocated: number;
  newEntryRemaining: number;
  newEntryStatus: 'PAID' | 'PARTIAL' | 'PENDING';
}

/**
 * Allocates a payment amount to a farmer's oldest pending/partial service entries.
 * Returns the allocations list and any remaining unallocated payment amount (e.g. overpayment).
 */
export function allocatePaymentFIFO(
  entries: EntryMini[],
  paymentAmount: number
): {
  allocations: PaymentAllocationResult[];
  unallocatedAmount: number;
} {
  const sortedEntries = [...entries]
    .filter(e => e.status !== 'PAID' && e.remainingAmount > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let remainingPayment = paymentAmount;
  const allocations: PaymentAllocationResult[] = [];

  for (const entry of sortedEntries) {
    if (remainingPayment <= 0) break;

    const amountNeeded = entry.remainingAmount;
    const allocated = Math.min(remainingPayment, amountNeeded);

    remainingPayment -= allocated;
    const newRemaining = amountNeeded - allocated;
    
    let newStatus: 'PAID' | 'PARTIAL' | 'PENDING' = 'PARTIAL';
    if (newRemaining <= 0) {
      newStatus = 'PAID';
    } else if (newRemaining === entry.totalAmount) {
      newStatus = 'PENDING';
    }

    allocations.push({
      entryId: entry.id,
      amountAllocated: Number(allocated.toFixed(2)),
      newEntryRemaining: Number(newRemaining.toFixed(2)),
      newEntryStatus: newStatus,
    });
  }

  return {
    allocations,
    unallocatedAmount: Number(remainingPayment.toFixed(2)),
  };
}

/**
 * Re-evaluates all allocations and balances for a farmer's ledger from scratch.
 */
export function reconstructLedgerFIFO(
  entries: EntryMini[],
  payments: { id: string; amount: number; date: Date | string }[]
): {
  updatedEntries: EntryMini[];
  allocations: { id: string; entryId: string; paymentId: string; amount: number }[];
  unallocatedPayments: { paymentId: string; remainingAmount: number }[];
} {
  const entriesCopy: EntryMini[] = entries.map(e => ({
    ...e,
    remainingAmount: e.totalAmount,
    status: 'PENDING'
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const allocations: { id: string; entryId: string; paymentId: string; amount: number }[] = [];
  const unallocatedPayments: { paymentId: string; remainingAmount: number }[] = [];

  let allocationIdCounter = 1;

  for (const payment of sortedPayments) {
    let paymentBalance = payment.amount;

    for (const entry of entriesCopy) {
      if (paymentBalance <= 0) break;
      if (entry.status === 'PAID' || entry.remainingAmount <= 0) continue;

      const needed = entry.remainingAmount;
      const allocated = Math.min(paymentBalance, needed);

      paymentBalance -= allocated;
      entry.remainingAmount = Number((entry.remainingAmount - allocated).toFixed(2));
      entry.status = entry.remainingAmount <= 0 ? 'PAID' : 'PARTIAL';

      allocations.push({
        id: `alloc-temp-${allocationIdCounter++}`,
        entryId: entry.id,
        paymentId: payment.id,
        amount: Number(allocated.toFixed(2))
      });
    }

    unallocatedPayments.push({
      paymentId: payment.id,
      remainingAmount: Number(paymentBalance.toFixed(2))
    });
  }

  return {
    updatedEntries: entriesCopy,
    allocations,
    unallocatedPayments
  };
}
