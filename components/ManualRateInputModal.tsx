import React, { useState } from "react";
import { View, Text, Button, Modal, StyleSheet } from "react-native";

export default function ManualRateInputModal({ visible, setVisible, callback }: { visible: boolean; setVisible: (v: boolean) => void; callback: (rate: string) => void; }) {
  return (
    <View>
      {/* <Button title="Show Dialog" onPress={() => setVisible(true)} /> */}

      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Please enter rate manually</Text>
            {(() => {
                function NumericPad() {
                    const [amount, setAmount] = useState<string>("");

                    const append = (ch: string) => {
                        if (ch === "." && amount.includes(".")) return;
                        if (amount === "0" && ch !== ".") setAmount(ch);
                        else setAmount((p) => (p + ch).slice(0, 12));
                    };
                    const backspace = () => setAmount((p) => p.slice(0, -1));
                    const clear = () => setAmount("");
                    const confirm = () => {
                        callback(amount || "0");
                        setVisible(false);
                    };

                    const NumBtn = ({ title, onPress }: { title: string; onPress: () => void }) => (
                        <View style={{ flex: 1, marginHorizontal: 4 }}>
                            <Button title={title} onPress={onPress} />
                        </View>
                    );

                    return (
                        <View>
                            <Text style={{ fontSize: 24, textAlign: "center", marginVertical: 10 }}>{amount || "0"}</Text>

                            <View style={{ flexDirection: "row", marginVertical: 6 }}>
                                <NumBtn title="1" onPress={() => append("1")} />
                                <NumBtn title="2" onPress={() => append("2")} />
                                <NumBtn title="3" onPress={() => append("3")} />
                            </View>

                            <View style={{ flexDirection: "row", marginVertical: 6 }}>
                                <NumBtn title="4" onPress={() => append("4")} />
                                <NumBtn title="5" onPress={() => append("5")} />
                                <NumBtn title="6" onPress={() => append("6")} />
                            </View>

                            <View style={{ flexDirection: "row", marginVertical: 6 }}>
                                <NumBtn title="7" onPress={() => append("7")} />
                                <NumBtn title="8" onPress={() => append("8")} />
                                <NumBtn title="9" onPress={() => append("9")} />
                            </View>

                            <View style={{ flexDirection: "row", marginVertical: 6 }}>
                                <NumBtn title="." onPress={() => append(".")} />
                                <NumBtn title="0" onPress={() => append("0")} />
                                <NumBtn title="⌫" onPress={backspace} />
                            </View>

                            <View style={styles.actions}>
                                <Button title="Clear" onPress={clear} />
                                <Button title="Cancel" onPress={() => setVisible(false)} />
                                <Button title="Save" onPress={confirm} />
                            </View>
                        </View>
                    );
                }

                return <NumericPad />;
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
});