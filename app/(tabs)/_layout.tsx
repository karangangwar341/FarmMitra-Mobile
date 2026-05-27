import React from 'react';
import { Tabs } from 'expo-router';
import { useLedgerStore } from '../../lib/store';
import { translations } from '../../lib/translations';
import { theme } from '../../lib/theme';
import { LayoutDashboard, Users, PlusCircle, IndianRupee, Settings } from 'lucide-react-native';

export default function TabLayout() {
  const language = useLedgerStore(state => state.language);
  const t = translations[language];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="farmers"
        options={{
          title: t.farmers,
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="entry"
        options={{
          title: t.addEntry,
          tabBarIcon: ({ color }) => <PlusCircle size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          title: t.payments,
          tabBarIcon: ({ color }) => <IndianRupee size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
