/**
 * Fetch full inventory list
 */
export const fetchInventoryApi = () => {
    // const sheetId = "1tKJTaPUjvp6HokO0iHP2IqlIugM432wswOLDkp5SAG4";
    const sheetId = "1tKJTaPUjvp6HokO0iHP2IqlIugM432wswOLDkp5SAG4";
    return fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`)
        .then(res => res.text())
        .then(text => {
            
            // Google Sheets gviz returns a JS wrapper like: /*...*/google.visualization.Query.setResponse({...});
            const m = text.match(/setResponse\(([\s\S]*)\);/);
            if (!m) return;
            const payload = JSON.parse(m[1]);
            const rows = payload.table?.rows ?? [];
            const tempList: any[] = [];
            rows.forEach((r: any, i: number) => {
                const values = {
                    id: r?.c[0]?.v ?? `item-${i}`,
                    name: r?.c[1]?.v ?? "Unnamed",
                    rate: r?.c[5]?.v ?? 0,
                    Qty: r?.c[10]?.v ?? 0,
                    type: (r?.c[2]?.v ?? "Kg").split((', ')),
                }
               tempList.push(values);
            });

            return tempList;
        });
};

export interface BillingDetails {
    id: string;
    name: string;
    rate: number;
    mode: "WEIGHT" | "PIECE";
    qty: number;
    amount: string;
    paymode: "CASH" | "CARD" | "UPI";
    date?: string;
}

//deploymentid AKfycbwBl8DnNiLFQjzyaIRgGInLS_ajmGaokIdOQXreXOI-fsUhRsdUfIQNWyMDmkVgZa6l
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBl8DnNiLFQjzyaIRgGInLS_ajmGaokIdOQXreXOI-fsUhRsdUfIQNWyMDmkVgZa6l/exec';

export const addRowToSheet = async (item: BillingDetails[], paymentMode: string) => {
    const payload =  JSON.stringify({ rows: item.map(i => ({
      name: i.name,
      rate: i.rate,
      qty: i.qty,
      mode: i.mode,
      amount: i.amount,
      paymentMode: paymentMode,
    }))});
    console.log('constructured payment payload:', payload);
    const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
    });

  return res.json();
};

export const fetchLastRow = async () => {
  const res = await fetch(SCRIPT_URL);
  return res.json();
};

export const retryAsync = async (
  fn: () => Promise<any>,
  retries = 3,
  delay = 1500
): Promise<any> => {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) {
      throw err;
    }
    await new Promise((res: any) => setTimeout(res, delay));
    return retryAsync(fn, retries - 1, delay);
  }
};
