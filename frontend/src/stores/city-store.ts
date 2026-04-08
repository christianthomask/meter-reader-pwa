import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CityState {
  selectedCityId: string | null;
  selectedCityName: string | null;
  setSelectedCity: (id: string | null, name: string | null) => void;
}

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      selectedCityId: null,
      selectedCityName: null,
      setSelectedCity: (id, name) =>
        set({ selectedCityId: id, selectedCityName: name }),
    }),
    { name: "city-store" }
  )
);
