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
    billNumber: string;
    paymentMode: string;
    empName: string;
}

//deploymentid AKfycbwBl8DnNiLFQjzyaIRgGInLS_ajmGaokIdOQXreXOI-fsUhRsdUfIQNWyMDmkVgZa6l
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBl8DnNiLFQjzyaIRgGInLS_ajmGaokIdOQXreXOI-fsUhRsdUfIQNWyMDmkVgZa6l/exec';

export const addRowToSheet = async (item:  BillingDetails[]) => {
    const payload =  JSON.stringify({ rows: item.map(i => ({
      name: i.name,
      rate: i.rate,
      qty: i.qty,
      mode: i.mode,
      amount: i.amount,
      paymentMode: i.paymentMode,
      empName: i.empName,
      billNumber: i.billNumber,
    })), sheetName: 'Thaya', type: 'sync'});
    //sheetName: 'Demo' is for testing purpose only. Change it to 'Thaya' when needed.
    console.log('constructured payment payload:', payload);
    const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
    });

  return res.json();
};

// Utility to format date as YYYYMMDD
const formatDate = (date = new Date()) => {
  const year = date.getFullYear().toString().substring(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

// Utility to format time as HHMMSS
const formatTime = (date = new Date()) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}${minutes}${seconds}`;
};

// Store generated bills in memory (replace with DB/AsyncStorage for persistence)
const generatedBills = new Set();

export const generateBillNumber = () => {
  const now = new Date();
  const datePart = formatDate(now);
  const timePart = formatTime(now);
  let randomPart;
  let billNumber;

  do {
    // Generate random 4–5 character alphanumeric string
    randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    billNumber = `TH-${datePart}-${timePart}`;
  } while (generatedBills.has(billNumber));

  generatedBills.add(billNumber);

  return billNumber;
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
