import InvoiceTemplate from "../components/InvoiceTemplate";
import { notify } from "../services/notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getBillById } from "../services/billService";

export default function SingleBill() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("print") === "true";
  const printedBillId = useRef(null);

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadBill = useCallback(async () => {
    setLoading(true);
    setBill(null);
    try {
      const response = await getBillById(id);

      setBill(response.data);
    } catch (error) {
      console.error(error);

      notify(
        error.response?.data?.message ||
          error.message ||
          "Failed to load bill."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadBill(); }, [loadBill]);

  useEffect(() => {
    if (!bill || loading || !autoPrint || printedBillId.current === id) return;
    let cancelled = false;
    let timer;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (cancelled) return;
      timer = setTimeout(() => {
        if (cancelled) return;
        printedBillId.current = id;
        window.focus();
        window.print();
      }, 250);
    });
    return () => { cancelled = true; clearTimeout(timer); };
  }, [bill, loading, autoPrint, id]);

  if (loading) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-8">
        Bill not found.
      </div>
    );
  }

  return <InvoiceTemplate bill={bill} />;
}
