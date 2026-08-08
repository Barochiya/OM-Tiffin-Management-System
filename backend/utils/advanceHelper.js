const applyAdvance = (customerData, bill) => {

    if (!customerData || customerData.advanceBalance <= 0) {
        return;
    }

    const remaining =
        bill.totalAmount - bill.paidAmount;

    if (remaining <= 0) {
        return;
    }

    const advanceUsed = Math.min(
        customerData.advanceBalance,
        remaining
    );

    bill.paidAmount += advanceUsed;

    bill.pendingAmount =
        bill.totalAmount - bill.paidAmount;

    customerData.advanceBalance -= advanceUsed;

    if (bill.pendingAmount <= 0) {

        bill.pendingAmount = 0;
        bill.status = "Paid";

    } else {

        bill.status = "Partial";

    }

    return advanceUsed;
};

module.exports = applyAdvance;