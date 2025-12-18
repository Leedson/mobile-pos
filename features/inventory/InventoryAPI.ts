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