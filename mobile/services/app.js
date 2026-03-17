import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { api, PrepResponse, ExtractResponse, UrgencyLevel } from "./services/api";

export default function App() {
  const [bodyArea, setBodyArea] = useState("");
  const [concernDescription, setConcernDescription] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("low");
  const [startTime, setStartTime] = useState("");
  const [doctorNote, setDoctorNote] = useState("");

  const [prepResult, setPrepResult] = useState<PrepResponse | null>(null);
  const [extractResult, setExtractResult] = useState<ExtractResponse | null>(null);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [error, setError] = useState("");

  const submitPrep = async () => {
    try {
      setError("");
      setLoadingPrep(true);

      const result = await api.prep({
        body_area: bodyArea,
        concern_description: concernDescription,
        urgency,
        start_time: startTime,
      });

      setPrepResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate visit prep.");
    } finally {
      setLoadingPrep(false);
    }
  };

  const submitExtract = async () => {
    try {
      setError("");
      setLoadingExtract(true);

      const result = await api.extract(doctorNote);
      setExtractResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract doctor note.");
    } finally {
      setLoadingExtract(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>Pulse</Text>
        <Text style={{ color: "#666" }}>AI health visit assistant</Text>

        {error ? (
          <View style={{ backgroundColor: "#fee", padding: 12, borderRadius: 10 }}>
            <Text style={{ color: "#900" }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ backgroundColor: "#f6f6f6", padding: 16, borderRadius: 16, gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: "600" }}>Visit Prep</Text>

          <TextInput
            placeholder="Body area"
            value={bodyArea}
            onChangeText={setBodyArea}
            style={{ backgroundColor: "#fff", padding: 12, borderRadius: 10 }}
          />

          <TextInput
            placeholder="Concern description"
            value={concernDescription}
            onChangeText={setConcernDescription}
            style={{ backgroundColor: "#fff", padding: 12, borderRadius: 10 }}
          />

          <TextInput
            placeholder="Start time"
            value={startTime}
            onChangeText={setStartTime}
            style={{ backgroundColor: "#fff", padding: 12, borderRadius: 10 }}
          />

          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["low", "medium", "high"] as UrgencyLevel[]).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setUrgency(level)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: urgency === level ? "#111" : "#ddd",
                }}
              >
                <Text style={{ color: urgency === level ? "#fff" : "#111", textTransform: "capitalize" }}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={submitPrep}
            style={{ backgroundColor: "#111", padding: 14, borderRadius: 12 }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
              {loadingPrep ? "Generating..." : "Generate Visit Prep"}
            </Text>
          </TouchableOpacity>

          {prepResult && (
            <View style={{ gap: 10, marginTop: 8 }}>
              <Text style={{ fontWeight: "700" }}>Summary</Text>
              <Text>{prepResult.symptom_summary}</Text>

              <Text style={{ fontWeight: "700", marginTop: 8 }}>Questions to Ask</Text>
              {prepResult.questions_to_ask.map((q, i) => (
                <Text key={i}>• {q}</Text>
              ))}

              <Text style={{ fontWeight: "700", marginTop: 8 }}>Concerns to Mention</Text>
              {prepResult.concerns_to_mention.map((item, i) => (
                <Text key={i}>
                  • {item.area} ({item.urgency})
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={{ backgroundColor: "#f6f6f6", padding: 16, borderRadius: 16, gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: "600" }}>Doctor Note Extraction</Text>

          <TextInput
            placeholder="Paste doctor note here"
            value={doctorNote}
            onChangeText={setDoctorNote}
            multiline
            style={{
              backgroundColor: "#fff",
              padding: 12,
              borderRadius: 10,
              minHeight: 120,
              textAlignVertical: "top",
            }}
          />

          <TouchableOpacity
            onPress={submitExtract}
            style={{ backgroundColor: "#111", padding: 14, borderRadius: 12 }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
              {loadingExtract ? "Extracting..." : "Extract Note"}
            </Text>
          </TouchableOpacity>

          {extractResult && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: "700" }}>Diagnosis</Text>
              <Text>{String(extractResult.diagnosis ?? "—")}</Text>

              <Text style={{ fontWeight: "700", marginTop: 8 }}>Key Advice</Text>
              {Array.isArray(extractResult.key_advice) && extractResult.key_advice.length > 0 ? (
                extractResult.key_advice.map((item, i) => <Text key={i}>• {item}</Text>)
              ) : (
                <Text>—</Text>
              )}

              <Text style={{ fontWeight: "700", marginTop: 8 }}>Follow Up</Text>
              <Text>{String(extractResult.follow_up_date ?? "—")}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}