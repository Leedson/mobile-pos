import { db } from './db';

export async function createBill(total: any) {
  const database = await db;
  const res = await database.executeAsync(
    `INSERT INTO bills (total, created_at)
     VALUES (?, datetime('now'))`,
    [total]
  );
  return res.insertId;
}

export async function insertBillItems(billId: any, items: any[]) {
  const database = await db;
  await database.transaction(tx => {
    items.forEach(i => {
      tx.executeAsync(
        `INSERT INTO bill_items
         (bill_id, name, rate, qty, mode, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [billId, i.name, i.rate, i.qty, i.mode, i.amount]
      );
    });
  });
}

export async function fetchTodaysReport() {
  const database = await db;
  const res = await database.executeAsync(`SELECT * FROM bills WHERE date(created_at) = date('now');`);
  return res;
}
