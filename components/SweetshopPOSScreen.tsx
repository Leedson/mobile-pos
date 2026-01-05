// SweetShopPOSScreen.js
// FULL React Native POS Screen (Tablet-friendly)
// Features:
// - Alphabet-based selection
// - Search
// - Weight OR Piece mode
// - Add / Delete bill items
// - Live total calculation

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert
} from "react-native";
import { fetchInventory } from "../features/inventory/InventorySlice";
import { useDispatch, useSelector } from "react-redux";
import { formatThermalBill } from "../servies/ThermalPrintService";
import { generateBillReceipt, generateBillText, saveBillPdf } from "../servies/Bill";
import { SafeAreaView } from "react-native-safe-area-context";
// import { initDatabase } from "../src/database/initDatabase";
// import { createBill, fetchTodaysReport, insertBillItems } from "../src/database/billingRepo";
import { generateReportHTML, saveReportPdf } from "../servies/Reports";
import { fetchLastRow, BillingDetails, addRowToSheet, retryAsync } from "../features/inventory/InventoryAPI";
import { Dimensions } from "react-native";
import ManualRateInputModal from "./ManualRateInputModal";
import {ThermalPrinter} from '@finan-me/react-native-thermal-printer';

// -------------------- SAMPLE DATA --------------------
const PRODUCTS = [
  { id: "1", name: "Kaju Katli", rate: 850 },
  { id: "2", name: "Kalakand", rate: 620 },
  { id: "3", name: "Khoya Roll", rate: 700 },
  { id: "4", name: "Mysore Pak", rate: 620 },
  { id: "5", name: "Rasgulla", rate: 480 },
  { id: "6", name: "Rasmalai", rate: 520 },
  { id: "7", name: "Laddu", rate: 520 },
  { id: "8", name: "Halwa", rate: 450 },
  { id: "9", name: "Cake", rate: 600 },
];

const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-".split("");
const WEIGHTS = [0.1, 0.25, 0.5, 1]; // kg

// -------------------- COMPONENT --------------------
export default function SweetShopPOSScreen() {
  type Product = typeof PRODUCTS[number];
  type BillItem = {
    name: string;
    rate: number;
    mode: "WEIGHT" | "PIECE";
    qty: number;
    amount: string;
    type?: string[];
  };
  const NUM_COLUMNS = 2; // always fixed


  // cache current screen info and keep it updated on dimension changes
  const [screenInfo, setScreenInfo] = useState(getScreenInfo());
  Dimensions.addEventListener("change", () => {
    setScreenInfo(getScreenInfo());
  });



  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [letter, setLetter] = useState("A");
  const [selected, setSelected] = useState<any | null>(null);

  const [mode, setMode] = useState<"WEIGHT" | "PIECE">("WEIGHT"); // WEIGHT | PIECE
  const [weight, setWeight] = useState(0.25);
  const [pieces, setPieces] = useState(1);
  const [loader, setLoader] = useState(false);
  const [pendingBills, setPendingBills] = useState<any[]>([]);
  const [pendingQueue, setPendingQueue] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "CARD" | "UPI">("CASH");
  const [rateModalInputVisible, setRateModalInputVisible] = useState<boolean>(false);

  const [bill, setBill] = useState<BillItem[]>([]);

  // ensure you import useDispatch and useSelector from 'react-redux' at the top
  const dispatch = useDispatch();

  const handleScan = async () => {
    const {paired, found} = await ThermalPrinter.scanDevices();
    return null;
    // console.log(found);
    // if(found) {
    //   return found[0].address;
    // }
    //setDevices(found);
  };

  const handlePrint = async (receiptText: string) => {
    let mac: any = await handleScan();
    if(!mac) {
      mac = 'bt:66:32:3D:B4:93:FC'; //default mac address for testing
    };
   
    const job = {
    printers: [
      {
        address: mac,
        options: {
          paperWidthMm: 78, // 58mm or 80mm
          encoding: 'UTF‑8',
          marginMm: 3, // 1mm margin each side (default)
        },
      },
    ],
    documents: [generateBillReceipt(bill, empName)],
}

await ThermalPrinter.printReceipt(job as any);
  };



  const inventory = useSelector((state: any) => state.inventory.items);
  const empName = useSelector((state: any) => state.inventory.empName);

  // fetch inventory once, and reset qty when mode changes
  useEffect(() => {
    dispatch(fetchInventory() as any);
  }, [dispatch]);

  useEffect(() => {
    // reset qty when mode changes
    setWeight(0.25);
    setPieces(1);
  }, [mode]);

  useEffect(() => {
    setProducts(inventory);
  }, [inventory]);

  useEffect(() => {
    if (selected) {
      if (selected.mode === "PIECE") {
        setPieces(selected.qty);
      } else if (selected.mode === "WEIGHT") {
        setWeight(selected.qty);
      }

      if (selected.type.some((t: any) => t === 'Kg')) {
        setMode("WEIGHT");
      } else {
        setMode("PIECE");
      }
    }
  }, [selected]);


  // useEffect(() => {
  //   // initDatabase();  
  //   fetchLastRow().then((row) => {
  //     console.log("Last edited row:", row.lastRow[0]);
  //     setLastEditedRowId(row.lastRow[0]);
  //   }); 
  // }, []);

  // -------------------- FILTER LOGIC --------------------
  const filtered = useMemo(() => {
    if (!letter && !query) return [];
    return products.filter(
      (p) =>
        p.name.toUpperCase().startsWith(letter) &&
        p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [letter, query]);

  // -------------------- BILL ACTIONS --------------------
  const addItem = () => {
    if (!selected) return;
    const qty = mode === "WEIGHT" ? weight : pieces;
    const amount = mode === "WEIGHT"
      ? selected.rate * weight
      : selected.rate * pieces;

    setBill((b) => [
      ...b,
      {
        name: selected.name,
        rate: selected.rate,
        mode,
        qty,
        amount: amount.toFixed(2),
      },
    ]);

    // reset
    setSelected(null);
    setMode("WEIGHT");
    setWeight(0.25);
    setPieces(1);
  };

  const deleteItem = (index: number) => {
    setBill((b) => b.filter((_, i) => i !== index));
  };

  const total = bill
    .reduce((sum, item) => sum + Number(item.amount), 0)
    .toFixed(2);

  const setLetterWithTime = (ltr: string) => () => {
    if (ltr === '-') {
      setLetter('');
      setSelected(null);
      return;
    }
    // append the pressed alphabet (up to 3 chars), then clear after debounce interval
    const DEBOUNCE_MS = 800;
    const MAX_LEN = 3;

    // clear any existing timer (store timer on globalThis so it persists across renders)
    if ((globalThis as any).__alphaTimer) {
      clearTimeout((globalThis as any).__alphaTimer);
    }
    // console.log('formed ltters2e..', timerDebounce);
    setLetter((prev) => {
      let letter = prev + ltr;
      if (!(globalThis as any).__timerDebounce) {
        letter = ltr;
      }
      const next = letter.slice(0, MAX_LEN).toUpperCase();
      // console.log('formed ltters..', next, (globalThis as any).__timerDebounce);
      return next;
    });
    (globalThis as any).__timerDebounce = 1;
    (globalThis as any).__alphaTimer = setTimeout(() => {
      (globalThis as any).__timerDebounce = 0;
      (globalThis as any).__alphaTimer = undefined;
    }, DEBOUNCE_MS);
  };

  const setPendingBilling = () => {
    setPendingBills(pendingBills => [...pendingBills, bill]);
    setBill([]);
    Alert.alert("Success", "Bill has been moved to pending bills.");
  }

  
  async function printBill(items: any, empName: string) {
    // const receiptText = generateBillText(items, empName);
    await handlePrint('');
  }


  const printAndSaveBill = () => async () => {
    // MOCK function - implement actual print and save logic as needed
    // console.log("Printing bill...", bill);
    // const formattedBill = formatThermalBill(bill, 1542);
    // console.log(formattedBill);
    setLoader(true);
    saveBillPdf(bill);
    await printBill(bill, empName);
    setBill([]); // clear bill after printing
    setTimeout(() => {
      Alert.alert("Success", "Bill has been generated.");
      setLoader(false);
    }, 500);

    retryAsync(() => addRowToSheet(bill as unknown as BillingDetails[], paymentMode, empName), 3, 1500).then(() => {
      // setLastEditedRowId(prev => prev + 1);
    }).catch(() => {
      // Alert.alert("Error", "Failed to make the network.");
    });


    // addRowToSheet(bill as unknown as BillingDetails[], lastEditedRowId, paymentMode).then(() => {
    //   setLastEditedRowId(prev => prev + 1);
    // }).catch(() => {
    //   // Alert.alert("Error", "Failed to make the network.");
    // });
    // createBill(total).then((billId) => {
    //   insertBillItems(billId, bill).then(() => {
    //     Alert.alert("Success", "Bill has been printed and saved.");
    //     setLoader(false);
    //   }).catch(() => {
    //     Alert.alert("Error", "Failed to save bill items.");
    //     setLoader(false);
    //   });
    // }).catch(() => {
    //   Alert.alert("Error", "Failed to save bill.");
    //   setLoader(false);
    // });

  }

  const generateTodaysReport = () => {
    // fetchTodaysReport().then((res) => {
    //   console.log("Today's Report:", res);
    //   Alert.alert("Report", `Fetched ${res.rows?.length} bills for today.`);
    //   saveReportPdf(res.rows?._array || []);
    // }).catch(() => {
    //   Alert.alert("Error", "Failed to fetch today's report.");
    // });
  }

  const handleRowPress = (item: BillItem, index: number) => {
    if (item.mode === "WEIGHT") {
      item.type = ['Kg'];
    } else {
      item.type = ['Pc'];
    }
    setSelected(item);
    setBill(bill => bill.filter((_, i) => i !== index));
  }


  // -------------------- UI --------------------
  return (
    <SafeAreaView style={styles.container}>
      {loader && (
        <View style={{ height: 8, backgroundColor: "#F3F4F6", margin: 8, borderRadius: 4, overflow: "hidden" }}>
          <View style={{ width: "60%", height: "100%", backgroundColor: "#F97316" }} />
        </View>
      )}
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.topText}>Bill {Date.now()}</Text>
        <Text style={styles.topText}>Sweet Shop POS: {empName}</Text>
      </View>

      <View style={styles.body}>
        {/* LEFT PANEL */}
        {!pendingQueue ? <View style={styles.left}>
          {/* <TextInput
            placeholder="Search sweet"
            value={query}
            onChangeText={setQuery}
            style={styles.search}
          /> */}
          <TouchableOpacity
            style={styles.itemBtn}
            onPress={() => setPendingQueue(!pendingQueue)}
          >
            <Text style={styles.addText}>Show Pending bills</Text>
          </TouchableOpacity>
          <FlatList
            data={filtered}
            numColumns={NUM_COLUMNS}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true}
            ListHeaderComponent={() => (
              <FlatList
                data={ALPHABETS}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.alphaRow}
                horizontal={false}
                numColumns={screenInfo.isLandscape ? 5 : 4}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={setLetterWithTime(item)}
                    style={[
                      styles.alphaBtn,
                      screenInfo.isLandscape ? styles.alphaBtnTablet : styles.alphaBtnMobile,
                      letter === item && styles.alphaActive,
                    ]}
                  >
                    <Text style={styles.alphaText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemBtn}
                onPress={() => setSelected(item)}
              >
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemRate}>₹{item.rate}/kg</Text>
              </TouchableOpacity>
            )}
          />
        </View> : <View style={styles.left}>
          <TouchableOpacity
            style={styles.itemBtn}
            onPress={() => setPendingQueue(!pendingQueue)}  >
            <Text style={styles.addText}>Back to Billing</Text>
          </TouchableOpacity>
        </View>
        }
        <ManualRateInputModal visible={rateModalInputVisible} setVisible={setRateModalInputVisible} callback={(amount: string) => {
          const enteredAmount = parseFloat(amount);
          if (!selected || isNaN(enteredAmount)) {
            setRateModalInputVisible(false);
            return;
          }
          const unitRate = Number(selected.rate) || 0;
          if (unitRate <= 0) {
            setRateModalInputVisible(false);
            return;
          }
          if (mode === "WEIGHT") {
            // enteredAmount is total amount -> weight = total / rate (kg)
            const newWeight = parseFloat((enteredAmount / unitRate).toFixed(3));
            setWeight(Math.max(0, newWeight));
          } else {
            // PIECE mode -> pieces = total / rate (pcs)
            const newPieces = parseFloat((enteredAmount / unitRate).toFixed(3));
            setPieces(Math.max(0, newPieces));
          }
          setRateModalInputVisible(false);
        }} />

        {/* CENTER PANEL */}
        <View style={styles.center}>
          {selected && !pendingQueue ? (
            <>
              <Text style={styles.selTitle}>{selected.name}</Text>
              <Text style={styles.selRate}>₹{selected.rate}</Text>
              <Text style={{ marginBottom: 10 }}>Calculated Rate: ₹{selected.rate * (mode === "WEIGHT" ? weight : pieces)}</Text>
              <TouchableOpacity
                onPress={() => setRateModalInputVisible(true)}
                style={[styles.qtyBtn, { minWidth: 72, marginBottom: 6, paddingVertical: 14 }]}
              >
                <Text>MR</Text>
              </TouchableOpacity>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  onPress={() => setMode("WEIGHT")}
                  style={[styles.modeBtn, mode === "WEIGHT" && styles.modeActive]}
                >
                  <Text>WEIGHT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMode("PIECE")}
                  style={[styles.modeBtn, mode === "PIECE" && styles.modeActive]}
                >
                  <Text>PIECE</Text>
                </TouchableOpacity>
              </View>
              {
                mode === "WEIGHT" ? <Text style={styles.qtyText}>{weight} kg</Text> : <Text style={styles.qtyText}>{pieces} pcs</Text>
              }
              <ScrollView>
                {mode === "WEIGHT" ? (
                  <>

                    <View style={styles.qtyRow}>
                      {WEIGHTS.map((w) => (
                        <TouchableOpacity
                          key={w}
                          onPress={() => setWeight(w)}
                          style={styles.qtyBtn}
                        >
                          <Text>{w * 1000}g</Text>
                          <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
                            <TouchableOpacity
                              onPress={() =>
                                setWeight((prev) => Math.max(w, parseFloat((prev - w).toFixed(3))))
                              }
                              style={{ padding: 6, backgroundColor: "#fff", borderRadius: 6, marginRight: 6 }}
                            >
                              <Text>-</Text>
                            </TouchableOpacity>

                            <Text style={{ minWidth: 36, textAlign: "center" }}>
                              {Math.max(0, Math.round(weight / w))}x
                            </Text>

                            <TouchableOpacity
                              onPress={() =>
                                setWeight((prev) => parseFloat((prev + w).toFixed(3)))
                              }
                              style={{ padding: 6, backgroundColor: "#fff", borderRadius: 6, marginLeft: 6 }}
                            >
                              <Text>+</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                ) : (
                  <>
                    {/* <Text style={styles.qtyText}>{pieces} pcs</Text> */}
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setPieces(Math.max(1, pieces - 1))}
                      >
                        <Text>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setPieces(pieces + 1)}
                      >
                        <Text>+</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {
                  mode !== "WEIGHT" &&
                  (() => {
                    if (!(globalThis as any).__pieceInput || parseFloat((globalThis as any).__pieceInput) !== pieces) {
                      (globalThis as any).__pieceInput = String(pieces);
                    }

                    const handleKey = (k: string) => {
                      let cur: string = (globalThis as any).__pieceInput || "0";
                      if (k === "⌫") {
                        cur = cur.slice(0, -1);
                        if (cur === "" || cur === "-" || cur === ".") cur = "0";
                      } else if (k === ".") {
                        if (!cur.includes(".")) cur = cur + ".";
                      } else {
                        // digit
                        if (cur === "0") cur = k;
                        else cur = cur + k;
                      }
                      (globalThis as any).__pieceInput = cur;
                      const parsed = parseFloat(cur);
                      setPieces(isNaN(parsed) ? 0 : parsed);
                    };

                    const rows = [
                      ["1", "2", "3"],
                      ["4", "5", "6"],
                      ["7", "8", "9"],
                      [".", "0", "⌫"],
                    ];

                    return (
                      <View style={{ width: "100%", alignItems: "center", marginTop: 12 }}>
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontSize: 20 }}>{(globalThis as any).__pieceInput}</Text>
                        </View>

                        {rows.map((row, ri) => (
                          <View key={ri} style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
                            {row.map((k) => (
                              <TouchableOpacity
                                key={k}
                                onPress={() => handleKey(k)}
                                style={[styles.qtyBtn, { minWidth: 72, marginHorizontal: 6, paddingVertical: 14 }]}
                              >
                                <Text style={{ fontSize: 18 }}>{k}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ))}
                      </View>
                    );
                  })()
                }

                <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                  <Text style={styles.addText}>ADD TO BILL</Text>
                </TouchableOpacity>
              </ScrollView>
            </>
          ) : (
            <Text style={styles.placeholder}>Select a sweet</Text>
          )}
          {
            pendingQueue && pendingBills.length === 0 && <Text style={styles.placeholder}>No pending bills</Text>
          }
          {
            pendingQueue && pendingBills.length > 0 && <FlatList
              data={pendingBills}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item, index }: { item: any, index: number }) => (
                <TouchableOpacity
                  style={styles.itemBtn}
                  onPress={() => {
                    setBill(item);
                    setPendingBills(pendingBills.filter((_, i) => i !== index));
                    setPendingQueue(false);
                  }}
                >
                  <Text style={styles.itemName}>Pending Bill #{index + 1}</Text>
                  {
                    item.map((it: any) => (
                      <Text key={it.name} style={styles.itemRate}>{it.name} - ₹{it.amount} - {item.qty}</Text>
                    ))
                  }
                </TouchableOpacity>
              )}
            />
          }
        </View>

        {/* RIGHT PANEL */}
        <View style={styles.right}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={styles.billTitle}>Bill Items</Text>
            <TouchableOpacity onPress={() => setBill([])} style={{ padding: 2, width: 30, justifyContent: "center", alignItems: "center", display: "flex", backgroundColor: "#FCA5A5", borderRadius: 6 }}>
              <Text style={{ fontWeight: "700", color: "#7F1D1D" }}>X</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            nestedScrollEnabled={true}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
            initialNumToRender={10}
            windowSize={21}
            data={bill}
            keyExtractor={(_, i) => i.toString()}
            style={{ paddingRight: 10 }}
            renderItem={({ item, index }: { item: any, index: number }) => (
              <TouchableOpacity onPress={() => handleRowPress(item, index)} style={styles.billRow}>
                <Text style={styles.billItem}>{item.name}</Text>
                <Text style={{ fontSize: 18 }}>{item.mode === "WEIGHT" ? `${item.qty}kg` : `${item.qty} pcs`}</Text>
                <Text style={{ fontSize: 18 }}>₹{item.amount}</Text>
                <TouchableOpacity onPress={() => deleteItem(index)}>
                  <Text style={styles.delete}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
          <Text style={styles.total}>TOTAL ₹{total}</Text>
          <Text style={styles.total}>Selected Payment mode: {paymentMode}</Text>
          <TouchableOpacity style={styles.payBtn} onPress={() => setPaymentMode("CASH")}><Text>CASH</Text></TouchableOpacity>
          <TouchableOpacity style={styles.payBtn} onPress={() => setPaymentMode("UPI")}><Text>UPI</Text></TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM BAR */}
      <View style={styles.bottom}>
        {bill.length > 0 && <TouchableOpacity style={styles.payBtn} onPress={setPendingBilling}><Text>Set to Pending Bills</Text></TouchableOpacity>}
        {/* <TouchableOpacity style={styles.payBtn} onPress={generateTodaysReport}><Text>Report(today's)</Text></TouchableOpacity> */}
        <TouchableOpacity style={[styles.payBtn, styles.printBtn]} onPress={printAndSaveBill()}>
          <Text>PRINT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


// helper to get up-to-date values (call from components if you need realtime info)
export const getScreenInfo = () => {
  const { width: w, height: h } = Dimensions.get("window");
  const portrait = h >= w;
  const tablet = Math.min(w, h) >= 600;
  return {
    width: w,
    height: h,
    isPortrait: portrait,
    isLandscape: !portrait,
    isTablet: tablet,
    ALPHA_SIZE: tablet ? 70 : 50,
  };
};

// -------------------- STYLES --------------------
const { width, height } = Dimensions.get("window");

const isTablet = Math.min(width, height) >= 600; // breakpoint: 600dp
const ALPHA_SIZE = isTablet ? 70 : 50;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#7C2D12",
  },
  topText: { color: "#fff", fontWeight: "700" },

  body: { flex: 1, flexDirection: "row" },

  left: { flex: 3, padding: 8 },
  center: { flex: 3, padding: 8, alignItems: "center", justifyContent: "center" },
  right: { flex: 4, padding: 5, backgroundColor: "#FFF" },

  search: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },

  alphaRow: { flexDirection: "row", marginBottom: 6 },
  alphaBtn: {
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
    borderRadius: 4,
    backgroundColor: "#E7E5E4",
  },
  alphaBtnTablet: {
    width: 70,
    height: 70,
  },
  alphaBtnMobile: {
    width: 50,
    height: 50,
  },
  alphaActive: { backgroundColor: "#FB923C" },
  alphaText: { fontSize: 12, fontWeight: "700" },

  itemBtn: {
    flex: 1,
    backgroundColor: "#FED7AA",
    margin: 4,
    padding: 12,
    borderRadius: 10,
  },
  itemName: { fontWeight: "700" },
  itemRate: { fontSize: 12 },

  selTitle: { fontSize: 22, fontWeight: "800" },
  selRate: { marginBottom: 10 },

  modeRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  modeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  modeActive: { backgroundColor: "#86EFAC" },

  qtyText: { fontSize: 24, textAlign: "center" },
  qtyRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  qtyBtn: {
    padding: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    minWidth: 30,
    alignItems: "center",
  },

  addBtn: {
    marginTop: 20,
    backgroundColor: "#16A34A",
    padding: 14,
    borderRadius: 10,
  },
  addText: { color: "#fff", fontWeight: "800" },

  placeholder: { color: "#78716C" },

  billTitle: { fontWeight: "800", marginBottom: 6 },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  billItem: { flex: 1, fontSize: 18 },
  delete: { color: "red", fontWeight: "800", fontSize: 18 },

  total: { fontSize: 18, fontWeight: "800", marginTop: 10 },

  bottom: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#E7E5E4",
    // marginBottom: 30
  },
  payBtn: {
    padding: 14,
    backgroundColor: "#FDE68A",
    borderRadius: 10,
    minWidth: 70,
    alignItems: "center",
  },
  printBtn: { backgroundColor: "#86EFAC" },
});