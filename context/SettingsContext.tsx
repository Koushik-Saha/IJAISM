'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type PublicSettings = {
    site_name: string;
    site_logo_url: string;
    site_location: string;
    site_contact_email: string;
    site_contact_phone: string;
    site_mission: string;
    site_vision: string;
};

type SettingsContextType = {
    settings: PublicSettings;
    loading: boolean;
};

const defaultSettings: PublicSettings = {
    site_name: 'C5K',
    site_logo_url: '/logo.png',
    site_location: '761 State Highway 100, Port Isabel, TX 78578, USA',
    site_contact_email: 'contact@c5k.com',
    site_contact_phone: '',
    site_mission: '',
    site_vision: ''
};

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    loading: true
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<PublicSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/public');
                if (!res.ok) throw new Error('Failed to fetch public settings');
                const data = await res.json();
                setSettings(data.settings);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
