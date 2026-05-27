import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useLedgerStore } from '../lib/store';
import { translations } from '../lib/translations';
import { theme } from '../lib/theme';
import { ArrowRight } from 'lucide-react-native';

interface ParsedResult {
  farmerId?: string;
  farmerName?: string;
  area?: number;
  service?: string;
  crop?: string;
  amount?: number;
  isPayment: boolean;
}

function parseVoiceText(text: string, farmersList: { id: string; name: string }[]): ParsedResult {
  const normalized = text.toLowerCase();
  const isPayment = (normalized.includes('diye') || normalized.includes('jama') || normalized.includes('mila') || normalized.includes('payment')) && 
                    !normalized.includes('bigha');

  let area: number | undefined;
  let amount: number | undefined;

  const numberMatches = normalized.match(/(\d+(\.\d+)?)/g);
  if (numberMatches) {
    const num = parseFloat(numberMatches[0]);
    if (normalized.includes('bigha')) {
      area = num;
    } else {
      amount = num;
    }
  }

  let foundFarmer = farmersList.find(f => normalized.includes(f.name.toLowerCase()));

  let service: string | undefined;
  if (normalized.includes('paani') || normalized.includes('water') || normalized.includes('sinchai')) {
    service = 'water';
  } else if (normalized.includes('tractor') || normalized.includes('jotai') || normalized.includes('plough')) {
    service = 'tractor';
  } else if (normalized.includes('spray') || normalized.includes('dawai') || normalized.includes('pesticide')) {
    service = 'spray';
  } else if (normalized.includes('beej') || normalized.includes('seeds') || normalized.includes('khad')) {
    service = 'seeds';
  } else if (normalized.includes('labor') || normalized.includes('mazdoor') || normalized.includes('mazdoori')) {
    service = 'labor';
  }

  let crop: string | undefined;
  if (normalized.includes('gehun') || normalized.includes('wheat') || normalized.includes('gehu')) {
    crop = 'wheat';
  } else if (normalized.includes('dhan') || normalized.includes('paddy')) {
    crop = 'paddy';
  } else if (normalized.includes('aaloo') || normalized.includes('potato') || normalized.includes('aalu')) {
    crop = 'potato';
  } else if (normalized.includes('ganna') || normalized.includes('sugarcane')) {
    crop = 'sugarcane';
  } else if (normalized.includes('sarso') || normalized.includes('mustard')) {
    crop = 'mustard';
  }

  return {
    farmerId: foundFarmer?.id,
    farmerName: foundFarmer?.name,
    area,
    service,
    crop,
    amount,
    isPayment
  };
}

interface VoiceInputProps {
  onParsedResult: (result: ParsedResult) => void;
}

export default function VoiceInput({ onParsedResult }: VoiceInputProps) {
  const { farmers, language } = useLedgerStore();
  const t = translations[language];

  // Under mobile React Native we simplify the voice assistant to present preset test options 
  // since expo-av/expo-speech configuration can be highly platform-dependent and requires native configurations.
  const presets = [
    { text: "Ramveer ko 3 bigha paani diya", desc: "Water entry for Ramveer" },
    { text: "Sukhwinder ko 2.5 bigha tractor se jota", desc: "Tractor entry for Sukhwinder" },
    { text: "Ramveer ne 1500 rupay diye", desc: "Payment entry for Ramveer" },
  ];

  const selectPreset = (text: string) => {
    const res = parseVoiceText(text, farmers);
    onParsedResult(res);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎙️ {language === 'english' ? 'Voice Assistant Demo' : 'बोल कर लिखें'}</Text>
      <Text style={styles.subText}>{t.voiceHelpText}</Text>
      <Text style={styles.presetHeading}>TAP PRESET TO SIMULATE VOICE SPEECH:</Text>

      {presets.map((preset, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => selectPreset(preset.text)}
          style={styles.presetCard}
        >
          <Text style={styles.presetText}>"{preset.text}"</Text>
          <ArrowRight size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e6f4fe',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  subText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    marginBottom: 12,
  },
  presetHeading: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
});
export { parseVoiceText };
