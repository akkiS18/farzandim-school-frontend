import React, { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  onSelectAddress: (address: string) => void;
  onClose: () => void;
  initialAddress?: string;
}

export default function MapPicker({ onSelectAddress, onClose, initialAddress }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAddressText, setSelectedAddressText] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 41.311081, lng: 69.240562 }); // Tashkent default

  useEffect(() => {
    let active = true;
    let mapInstance: any = null;

    const initMap = async () => {
      // Dynamic import of Leaflet for SSR safety
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (!active) return;
      if (!mapContainerRef.current) return;

      // Prevent double initialization
      if ((mapContainerRef.current as any)._leaflet_id) {
        return;
      }

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 13);
      mapInstance = map;
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Handle marker drag
      marker.on("dragend", async () => {
        const position = marker.getLatLng();
        setCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      // Handle map click
      map.on("click", (e: any) => {
        const position = e.latlng;
        marker.setLatLng(position);
        setCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      const hasInitial = initialAddress && initialAddress.trim() !== "" && initialAddress.toLowerCase() !== "kiritilmagan";
      if (hasInitial) {
        setSelectedAddressText(initialAddress);
        geocodeAddress(initialAddress, map, marker);
      } else {
        setSelectedAddressText("");
        reverseGeocode(coords.lat, coords.lng);
      }
    };

    initMap();

    return () => {
      active = false;
      const instance = mapInstance || mapRef.current;
      if (instance) {
        try {
          instance.remove();
        } catch (e) {
          console.error("Error during map cleanup:", e);
        }
        mapRef.current = null;
      }
    };
  }, []);

  const geocodeAddress = async (addressText: string, mapInstance: any, markerInstance: any) => {
    if (!addressText.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCoords({ lat, lng });
        if (mapInstance) mapInstance.setView([lat, lng], 15);
        if (markerInstance) markerInstance.setLatLng([lat, lng]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { "Accept-Language": "uz,ru,en" }
      });
      const data = await res.json();
      if (data && data.display_name) {
        setSelectedAddressText(data.display_name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS bu brauzerda qo'llab-quvvatlanmaydi.");
      return;
    }

    setLoading(true);

    const successCallback = (position: any) => {
      const { latitude, longitude } = position.coords;
      setCoords({ lat: latitude, lng: longitude });
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], 16);
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }
      reverseGeocode(latitude, longitude);
    };

    const errorCallback = (error: any) => {
      console.warn("High-accuracy GPS failed, trying standard geolocation...", error);
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (err2) => {
          setLoading(false);
          console.error("Standard geolocation failed:", err2);
          let reason = "";
          if (err2.code === 1) {
            reason = "Ruxsat berilmadi (Permission Denied). Brauzerda joylashuv ruxsatini yoqing.";
          } else if (err2.code === 2) {
            reason = "Joylashuv aniqlanmadi (Position Unavailable). Windows/qurilma sozlamalarida 'Joylashuv' (Location services) yoqilganligini tekshiring.";
          } else if (err2.code === 3) {
            reason = "Kutish vaqti tugadi (Timeout). Internetni tekshiring.";
          } else {
            reason = err2.message;
          }
          alert(`Joylashuvni aniqlab bo'lmadi.\nSababi: ${reason}`);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 10000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 10000 }
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {/* Geocoding Search Bar */}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={selectedAddressText}
          onChange={(e) => setSelectedAddressText(e.target.value)}
          placeholder="Manzil qidirish..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
            fontSize: "12px",
            color: "#374151"
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              geocodeAddress(selectedAddressText, mapRef.current, markerRef.current);
            }
          }}
        />
        <button
          type="button"
          onClick={() => geocodeAddress(selectedAddressText, mapRef.current, markerRef.current)}
          style={{
            padding: "10px 14px",
            backgroundColor: "#4F46E5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Qidirish
        </button>
      </div>

      {/* Map view area with floating GPS targeting button */}
      <div style={{ position: "relative", width: "100%", height: "250px", borderRadius: "12px", overflow: "hidden", border: "1px solid #E5E7EB" }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%", zIndex: 1 }} />
        
        <button
          type="button"
          onClick={handleGPSLocation}
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            zIndex: 10,
            backgroundColor: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            fontSize: "18px"
          }}
          title="Mening joylashuvim"
        >
          🎯
        </button>
      </div>

      <div style={{ fontSize: "11px", color: "#6B7280", minHeight: "28px", lineHeight: "14px" }}>
        {loading ? (
          <span style={{ color: "#4F46E5", fontWeight: 600 }}>🔄 Manzil aniqlanmoqda...</span>
        ) : (
          <>
            <span style={{ fontWeight: 700, color: "#374151" }}>Belgilangan manzil:</span>{" "}
            {selectedAddressText || "Xaritadan tanlang"}
          </>
        )}
      </div>

      {/* Control Buttons */}
      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: "#F3F4F6",
            border: "none",
            borderRadius: "10px",
            color: "#374151",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "12px"
          }}
        >
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedAddressText) {
              onSelectAddress(selectedAddressText);
            }
            onClose();
          }}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: "#4F46E5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "12px"
          }}
        >
          Manzilni tasdiqlash
        </button>
      </div>
    </div>
  );
}
