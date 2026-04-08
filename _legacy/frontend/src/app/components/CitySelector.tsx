'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Loader2 } from 'lucide-react'
import type { City } from '@/lib/supabase'

interface CitySelectorProps {
  onCityChange?: (cityId: string) => void
}

export function CitySelector({ onCityChange }: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCities()
  }, [])

  async function loadCities() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Fetch cities assigned to this manager
      const { data, error } = await supabase
        .from('manager_cities')
        .select(`
          cities (*)
        `)
        .eq('manager_id', user.id)

      if (error) {
        console.error('Error loading cities:', error)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        const cityList = data.map((mc: any) => mc.cities)
        setCities(cityList)
        setSelectedCity(cityList[0].id)
        onCityChange?.(cityList[0].id)
      }
    } catch (err) {
      console.error('Error loading cities:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleCityChange(cityId: string) {
    setSelectedCity(cityId)
    onCityChange?.(cityId)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <MapPin size={18} className="text-blue-100" />
        <div className="flex items-center gap-2 bg-blue-700 text-white px-3 py-1 rounded text-sm">
          <Loader2 size={14} className="animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (cities.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin size={18} className="text-blue-100" />
      <select
        value={selectedCity}
        onChange={(e) => handleCityChange(e.target.value)}
        className="bg-blue-700 text-white border border-blue-600 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-white focus:outline-none cursor-pointer"
      >
        {cities.map(city => (
          <option key={city.id} value={city.id}>
            {city.name} ({city.status.replace('_', ' ')})
          </option>
        ))}
      </select>
    </div>
  )
}
