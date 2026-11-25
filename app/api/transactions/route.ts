import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const itemName = String(body?.item ?? "").trim();
    const quantity = Number(body?.qty) || 0;
    const modal = Number(body?.modal) || 0;
    const jual = Number(body?.jual) || 0;
    const paymentMethod = String(body?.method ?? "").toLowerCase();
    const margin = (jual - modal) * quantity;

    if (!supabaseServer) {
      return NextResponse.json({ ok: false, error: "Supabase belum dikonfigurasi" });
    }

    const { error } = await supabaseServer.from("transactions").insert({
      item_name: itemName,
      quantity,
      modal,
      jual,
      margin,
      payment_method: paymentMethod,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}