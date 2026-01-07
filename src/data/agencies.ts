export interface Agency {
    id: string;
    city: string;
    name: string;
    address: string;
}

export const agencies: { [key: string]: Agency[] } = {
    MRW: [
        // Caracas
        { id: "M-CCS-01", city: "Caracas", name: "MRW Altamira", address: "Av. San Juan Bosco, Edif. Centro Altamira, PB, Local 4" },
        { id: "M-CCS-02", city: "Caracas", name: "MRW La Candelaria", address: "Av. Urdaneta, Edif. Centro Urdaneta, PB" },
        { id: "M-CCS-03", city: "Caracas", name: "MRW Chacao", address: "Calle Élice, Edif. Blue House, PB" },
        { id: "M-CCS-04", city: "Caracas", name: "MRW Las Mercedes", address: "Calle Veracruz, Torre ABA, PB" },
        { id: "M-CCS-05", city: "Caracas", name: "MRW La Urbina", address: "Calle 4, Edif. Terras Plaza, PB" },
        // Barquisimeto
        { id: "M-BAR-01", city: "Barquisimeto", name: "MRW Centro", address: "Carrera 19 entre Calles 24 y 25" },
        { id: "M-BAR-02", city: "Barquisimeto", name: "MRW Este", address: "Av. Lara con Calle 5, C.C. Los Leones" },
        // Valencia
        { id: "M-VAL-01", city: "Valencia", name: "MRW Av. Bolívar", address: "Av. Bolívar Norte, C.C. Caribbean Plaza" },
        { id: "M-VAL-02", city: "Valencia", name: "MRW Zona Industrial", address: "Av. Henry Ford, C.C. Paseo Las Industrias" },
        // Maracaibo
        { id: "M-MAR-01", city: "Maracaibo", name: "MRW 5 de Julio", address: "Calle 77 (5 de Julio), Edif. Banco Industrial" },
        { id: "M-MAR-02", city: "Maracaibo", name: "MRW Bella Vista", address: "Av. 4 (Bella Vista), C.C. Costa Verde" },
        // Generic fallbacks will handle others
    ],
    Zoom: [
        // Caracas
        { id: "Z-CCS-01", city: "Caracas", name: "Zoom La Urbina", address: "Calle 7, Sector Sur, Edificio Grupo Zoom" },
        { id: "Z-CCS-02", city: "Caracas", name: "Zoom Altamira", address: "Av. Del Avila, Res. Belmont, PB, Local 01" },
        { id: "Z-CCS-03", city: "Caracas", name: "Zoom La Hoyada", address: "Av. Fuerzas Armadas, Edif. La Galeria PB Local 8" },
        { id: "Z-CCS-04", city: "Caracas", name: "Zoom Chacaito", address: "Av. Tamanaco, El Rosal, C.C. Arta, Piso 1" },
        { id: "Z-CCS-05", city: "Caracas", name: "Zoom Los Ruices", address: "Av. Francisco de Miranda, C.C. Los Ruices, PB" },
        { id: "Z-CCS-06", city: "Caracas", name: "Zoom Sambil La Candelaria", address: "Av. Este 0, C.C. Sambil, Nivel Sótano 1" },
        // Barquisimeto
        { id: "Z-BAR-01", city: "Barquisimeto", name: "Zoom Centro", address: "Carrera 27 entre calles 19 y 20" },
        { id: "Z-BAR-02", city: "Barquisimeto", name: "Zoom Aeropuerto", address: "Aeropuerto Gral. Jacinto Lara" },
        // Valencia
        { id: "Z-VAL-01", city: "Valencia", name: "Zoom Big Low", address: "C.C. Big Low Center, San Diego" },
        // Maracaibo
        { id: "Z-MAR-01", city: "Maracaibo", name: "Zoom Delicias", address: "Av. Delicias Norte, C.C. Delicias Norte" },
    ]
};

// Helper function to get agencies, generating generic ones if none exist for a city
export const getAgenciesForCity = (provider: string, city: string): Agency[] => {
    const providerAgencies = agencies[provider] || [];
    const specificAgencies = providerAgencies.filter(a => a.city === city);

    if (specificAgencies.length > 0) {
        return specificAgencies;
    }

    // Generate generic agencies if no specific data exists (Mocking for full coverage)
    // In a real app, you would fetch this from an API or have a comprehensive JSON
    return [
        { id: `${provider}-${city}-1`.replace(/\s/g, ''), city, name: `${provider} Agencia Principal ${city}`, address: `Av. Principal de ${city}, Zona Centro` },
        { id: `${provider}-${city}-2`.replace(/\s/g, ''), city, name: `${provider} Sede Norte ${city}`, address: `C.C. Norte, Local 5, ${city}` },
    ];
};
