import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMMKV } from "react-native-mmkv";
import { BillItem } from "../SweetshopPOSScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateBillReceipt } from "../../servies/Bill";
import { useSelector } from "react-redux";
import { ThermalPrinter } from "@finan-me/react-native-thermal-printer";

export default function ItemDetails() {
    const storage = useMMKV();
    const [bills, setBills] = useState<BillItem[]>([]);
    const [loader, setLoader] = useState(false);
    const empName = useSelector((state: any) => state.inventory.empName);
    const mac = useSelector((state: any) => state.inventory.mac);
    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        const tempBills = storage.getString('bills');
        if (tempBills) {
            const billsArray: BillItem[] = JSON.parse(tempBills);
            const groupByBillNumber = billsArray.reduce((a: any, b: BillItem) => {
                if (a[b.billNumber]) {
                    a[b.billNumber] = { ...a[b.billNumber], amount: Number(a[b.billNumber].amount) + Number(b.amount) };
                } else {
                    a[b.billNumber] = { amount: b.amount, empName: b.empName };
                }
                return a;
            }, {});
            const temp: any[] = [];
            for (const key in groupByBillNumber) {
                temp.push({
                    key,
                    totalAmount: groupByBillNumber[key].amount,
                    empName: groupByBillNumber[key].empName
                });
            }
            setBills(temp.reverse());
        }
    }

    const handlePrint = async (bill: any) => {
        // let mac: any = await handleScan();
        if (!mac) {
            return;
        };
        setLoader(true);
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
        try{
            await ThermalPrinter.printReceipt(job as any);
        } catch(e) {

        }
   
        setLoader(false);
    }

    const reprint = async (item: any) => {
        const tempBills = storage.getString('bills');
        if (tempBills) {
            const billsArray = JSON.parse(tempBills);
            const printables = billsArray.filter((bi: BillItem) => bi.billNumber === item.key);
            await handlePrint(printables);
            Alert.alert("Success", "Printed Successfully!");
        }

    }

    const deleteItem = (item: any) => {
        Alert.alert("Alert", "Are you sure want to delete?", [
            {
                text: "Cancel",
                onPress: () => console.log("Cancel Pressed"),
                style: "cancel"
            },
            {
                text: "OK",
                onPress: () => {
                    const tempBills = storage.getString('bills');
                    if (tempBills) {
                        const billsArray = JSON.parse(tempBills);
                        const printables = billsArray.filter((bi: BillItem) => bi.billNumber !== item.key);
                        storage.set('bills', JSON.stringify(printables));
                        Alert.alert("Success", "Deleted Successfully!");
                        refreshData();
                    }
                }
            }
        ],
            { cancelable: false } // Prevent closing by tapping outside
        );

    }

    const renderHeader = () => (
        <View style={styles.row}>
            <Text style={[styles.cell, styles.header]}>#</Text>
            <Text style={[styles.cell, styles.header]}>Bill No</Text>
            <Text style={[styles.cell, styles.header]}>Amount</Text>
            <Text style={[styles.cell, styles.header]}></Text>
            <Text style={[styles.cell, styles.header]}></Text>
        </View>
    );

    const renderItem = ({ item, index }: any) => (
        <View style={styles.row}>
            <Text style={styles.cell}>{index + 1}</Text>
            <Text style={styles.cell}>{item.key}</Text>
            <Text style={styles.cell}>{item.totalAmount}</Text>
            <TouchableOpacity disabled={loader} style={{...styles.itemBtn, ...(loader? { backgroundColor: 'grey' } : {})}} onPress={() => reprint(item)}>
                <Text style={{ color: 'white' }}>Print</Text>
            </TouchableOpacity>
            {item.empName?.toUpperCase() === 'DEMO' && <TouchableOpacity style={styles.itemBtnDel} onPress={() => deleteItem(item)}>
                <Text style={{ color: 'white' }}>Delete</Text>
            </TouchableOpacity>}
            
        </View>
    );

    return (
        <FlatList
            data={bills}
            keyExtractor={(_, i) => i.toString()}
            ListHeaderComponent={renderHeader}
            renderItem={renderItem}
            contentContainerStyle={styles.container}
        />
    );

}

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#ccc",
        paddingVertical: 8,
    },
    cell: {
        flex: 1, // equal width for all columns
        textAlign: "center",
        fontSize: 16,
    },
    header: {
        fontWeight: "bold",
        backgroundColor: "#f2f2f2",
        paddingVertical: 4,
    },

    itemBtn: {
        flex: 1,
        backgroundColor: "#34a984ff",
        margin: 4,
        padding: 12,
        borderRadius: 10,
    },
    itemBtnDel: {
        flex: 1,
        backgroundColor: "red",
        margin: 4,
        padding: 12,
        borderRadius: 10,
        color: "white",
    }
});
