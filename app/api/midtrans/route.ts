import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = String(body?.orderId ?? `NOKO-${Date.now()}`);
    const amount = Number(body?.amount) || 0;
    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";

    if (!serverKey) {
      return NextResponse.json({ ok: false, error: "MIDTRANS_SERVER_KEY belum diatur" });
    }

    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const res = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: amount },
        payment_type: "qris",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: data?.error_messages?.[0] ?? "Gagal membuat transaksi Midtrans",
      });
    }

    return NextResponse.json({
      ok: true,
      token: data.token,
      redirectUrl: data.redirect_url,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}