import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

function ParkingReservationCalendar({ oglasId, userId, cijena, stripePromise }) {
  const [reservations, setReservations] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const hours = Array.from({ length: 24 }, (_, i) => i); // 0:00 - 23:00

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function getWeekDays(startDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  }

  useEffect(() => {
    fetchReservations();
  }, [oglasId]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("Rezervacija")
        .select("*")
        .eq("id_oglasa", oglasId);

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Greška pri učitavanju rezervacija:", error);
    }
  };

  const isSlotReserved = (date, hour) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return reservations.some((reservation) => {
      const resStart = new Date(reservation.datumOd);
      const resEnd = new Date(reservation.datumDo);

      return (
        (slotStart >= resStart && slotStart < resEnd) ||
        (slotEnd > resStart && slotEnd <= resEnd) ||
        (slotStart <= resStart && slotEnd >= resEnd)
      );
    });
  };

  const isSlotSelected = (date, hour) => {
    const slotKey = `${date.toDateString()}-${hour}`;
    return selectedSlots.includes(slotKey);
  };

  /**
   * Validira da li su slotovi kontinuirani (bez praznih mjesta između)
   */
  const areSlotsContinuous = (slots) => {
    if (slots.length <= 1) return true;

    // Custom sort - sortiraj po datumu, pa po satu kao broju
    const sortedSlots = [...slots].sort((a, b) => {
      const [dateA, hourA] = a.split('-');
      const [dateB, hourB] = b.split('-');
      
      if (dateA === dateB) {
        // Isti datum, sortiraj po satu kao broju
        return parseInt(hourA) - parseInt(hourB);
      }
      // Različiti datumi, sortiraj po datumu kao string
      return dateA.localeCompare(dateB);
    });

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const currentSlot = sortedSlots[i];
      const nextSlot = sortedSlots[i + 1];

      const [currentDateStr, currentHourStr] = currentSlot.split('-');
      const [nextDateStr, nextHourStr] = nextSlot.split('-');

      const currentHour = parseInt(currentHourStr);
      const nextHour = parseInt(nextHourStr);

      // Ako su na istoj liniji (isti datum string)
      if (currentDateStr === nextDateStr) {
        // Satovi trebaju biti susjedni (razlika od 1)
        if (nextHour !== currentHour + 1) {
          return false;
        }
      } else {
        // Ako su na različitim linijama, trebalo bi:
        // Trenutni sat mora biti 23 (zadnji sat dana)
        // Sljedeći sat mora biti 0 (prvi sat sljedećeg dana)
        if (currentHour !== 23 || nextHour !== 0) {
          return false;
        }
      }
    }
    return true;
  };

  const handleSlotClick = (date, hour) => {
    if (isSlotReserved(date, hour)) return;

    const slotKey = `${date.toDateString()}-${hour}`;
    let newSelectedSlots;
    
    if (selectedSlots.includes(slotKey)) {
      newSelectedSlots = selectedSlots.filter(s => s !== slotKey);
    } else {
      newSelectedSlots = [...selectedSlots, slotKey];
      
      // Provjeri da li su slotovi kontinuirani
      if (!areSlotsContinuous(newSelectedSlots)) {
        alert("Možete birati samo kontinuirane termine (bez praznih mjesta između)!");
        return;
      }
    }
    
    setSelectedSlots(newSelectedSlots);
  };

  const handleMouseDown = (date, hour) => {
    if (isSlotReserved(date, hour)) return;
    setIsDragging(true);
    handleSlotClick(date, hour);
  };

  const handleMouseEnter = (date, hour) => {
    if (isDragging && !isSlotReserved(date, hour)) {
      const slotKey = `${date.toDateString()}-${hour}`;
      if (!selectedSlots.includes(slotKey)) {
        const newSelectedSlots = [...selectedSlots, slotKey];
        
        // Validira kontinuitet kada se povlači miš
        if (areSlotsContinuous(newSelectedSlots)) {
          setSelectedSlots(newSelectedSlots);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReservation = async () => {
    if (selectedSlots.length === 0) {
      alert("Molimo odaberite barem jedan termin");
      return;
    }

    if (!userId) {
      alert("Molimo prijavite se za rezervaciju");
      return;
    }

    // Otvori payment modal umjesto direktne rezervacije
    setShowPaymentModal(true);
  };

  const createReservationInDatabase = async () => {
    try {
      setLoading(true);
      // Grupiraj slotove po kontinuiranim periodima
      const sortedSlots = selectedSlots.sort();
      const reservationsToCreate = [];
      let currentGroup = [];

      sortedSlots.forEach((slot, index) => {
        const [dateStr, hourStr] = slot.split('-');
        const hour = parseInt(hourStr);
        const date = new Date(dateStr);
        
        if (currentGroup.length === 0) {
          currentGroup.push({ date, hour });
        } else {
          const lastSlot = currentGroup[currentGroup.length - 1];
          const isSameDay = lastSlot.date.toDateString() === date.toDateString();
          const isNextHour = lastSlot.hour + 1 === hour;

          if (isSameDay && isNextHour) {
            currentGroup.push({ date, hour });
          } else {
            reservationsToCreate.push(currentGroup);
            currentGroup = [{ date, hour }];
          }
        }

        if (index === sortedSlots.length - 1) {
          reservationsToCreate.push(currentGroup);
        }
      });

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

      // Kreiraj rezervacije kroz backend endpoint
      const slots = reservationsToCreate.map(group => {
        const startDate = new Date(group[0].date);
        startDate.setHours(group[0].hour, 0, 0, 0);

        const endDate = new Date(group[group.length - 1].date);
        endDate.setHours(group[group.length - 1].hour + 1, 0, 0, 0);

        return {
          datumOd: startDate.toISOString(),
          datumDo: endDate.toISOString(),
        };
      });

      const response = await fetch(`${API_BASE_URL}/api/reservations/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id_oglasa: oglasId,
          slots: slots,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Greška pri kreiranju rezervacija");
      }

      // Prikaži success modal umjesto alerta
      const startDate = new Date(selectedSlots[0].split('-')[0]);
      const endDate = new Date(selectedSlots[selectedSlots.length - 1].split('-')[0]);
      const message = `Plaćanje uspješno!\n\nRezervacija od ${startDate.toLocaleDateString('hr-HR')} do ${endDate.toLocaleDateString('hr-HR')}\nUkupno sati: ${selectedSlots.length}`;
      
      setSuccessMessage(message);
      setShowSuccessModal(true);
      setSelectedSlots([]);
      fetchReservations();
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Greška pri kreiranju rezervacije:", error);
      alert("Greška pri kreiranju rezervacije: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = getWeekDays(currentWeekStart);
  const dayNames = ["Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota", "Nedjelja"];
  const monthNames = [
    "Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
    "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"
  ];

  const formatDateRange = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    
    return `${currentWeekStart.getDate()}. - ${endDate.getDate()}. ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div style={styles.container} onMouseUp={handleMouseUp}>
      <h2 style={styles.title}>Kalendar rezervacija</h2>

      <div style={styles.toolbar}>
        <div style={styles.buttonGroup}>
          <button onClick={goToPreviousWeek} style={styles.navButton}>
            <span style={styles.navIcon}>←</span>
          </button>
          <button onClick={goToNextWeek} style={styles.navButton}>
            <span style={styles.navIcon}>→</span>
          </button>
        </div>
        
        <h3 style={styles.weekTitle}>{formatDateRange()}</h3>
        
        <button onClick={goToToday} style={styles.todayButton}>
          Danas
        </button>
      </div>

      <div style={styles.calendarWrapper}>
        <div style={styles.calendarContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.timeHeader}></th>
                {weekDays.map((day, index) => (
                  <th 
                    key={index} 
                    style={{
                      ...styles.dayHeader,
                      ...(isToday(day) ? styles.todayHeader : {})
                    }}
                  >
                    <div style={styles.dayHeaderContent}>
                      <span style={styles.dayName}>{dayNames[index].slice(0, 3)}</span>
                      <span style={styles.dayDate}>{day.getDate()}.{day.getMonth() + 1}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour} style={styles.timeRow}>
                  <td style={styles.timeCell}>
                    <span style={styles.timeLabel}>{hour}:00</span>
                  </td>
                  {weekDays.map((day, dayIndex) => {
                    const reserved = isSlotReserved(day, hour);
                    const selected = isSlotSelected(day, hour);
                    const isPast = new Date(day).setHours(hour, 0, 0, 0) < new Date();

                    return (
                      <td
                        key={dayIndex}
                        style={{
                          ...styles.slotCell,
                          ...(isToday(day) ? styles.todayColumn : {}),
                          ...(isPast && !reserved ? styles.pastSlot : {}),
                          ...(reserved ? styles.reservedSlot : {}),
                          ...(selected ? styles.selectedSlot : {}),
                        }}
                        onMouseDown={() => !isPast && handleMouseDown(day, hour)}
                        onMouseEnter={() => !isPast && handleMouseEnter(day, hour)}
                        title={reserved ? "Rezervirano" : selected ? "Odabrano" : "Dostupno"}
                      >
                        {reserved && (
                          <div style={styles.reservedIndicator}></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendBox, backgroundColor: "#fff", border: "2px solid #e0e0e0" }}></div>
          <span style={{ color: "#000" }}>Dostupno</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendBox, backgroundColor: "#f01111" }}></div>
          <span style={{ color: "#f01111" }}>Rezervirano</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendBox, backgroundColor: "#3498db" }}></div>
          <span style={{ color: "#3498db" }}>Odabrano</span>
        </div>
      </div>

      {selectedSlots.length > 0 && (
        <div style={styles.selectionInfo}>
          <p style={styles.selectionText}>
            <strong style={{ color: "#000" }}>Odabrano termina: {selectedSlots.length}</strong> 
          </p>
          <div style={styles.actionButtons}>
            <button
              onClick={() => setSelectedSlots([])}
              style={styles.clearButton}
            >
              Poništi odabir
            </button>
            <button
              onClick={handleReservation}
              disabled={loading}
              style={{
                ...styles.reserveButton,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Rezerviram..." : "Potvrdi rezervaciju"}
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: "20px" }}>Potvrdi plaćanje za rezervaciju</h3>
            <p><strong>Broj sati:</strong> {selectedSlots.length}</p>
            <p><strong>Cijena po satu:</strong> {cijena} €</p>
            <p style={{ fontSize: "18px", fontWeight: "bold", color: "#2196F3", marginBottom: "20px" }}>
              <strong>Ukupno:</strong> {(selectedSlots.length * cijena).toFixed(2)} €
            </p>
            
            {stripePromise && (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  amount={selectedSlots.length * cijena}
                  onSuccess={createReservationInDatabase}
                  onCancel={() => setShowPaymentModal(false)}
                />
              </Elements>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.successIcon}>✓</div>
            <h3 style={styles.successTitle}>Plaćanje uspješno!</h3>
            <p style={styles.successText}>{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={styles.successButton}
            >
              Zatvori
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Stripe Payment Form Component
function StripePaymentForm({ amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please try again.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found. Please refresh and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
      
      // Kreiraj payment intent
      const response = await fetch(`${API_BASE_URL}/api/payments/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ amount: Math.round(amount * 100) }), // U centima
      });

      if (!response.ok) {
        throw new Error(`Failed to create payment intent: ${response.statusText}`);
      }

      const { clientSecret } = await response.json();

      // Potvrdi plaćanje
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === "succeeded") {
        console.log("Payment successful:", paymentIntent);
        setLoading(false);
        onSuccess();
      } else {
        throw new Error("Payment was not successful");
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || "Payment failed. Please try again.");
      console.error("Payment error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Kartični podaci
        </label>
        <div style={{
          padding: "12px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          backgroundColor: "#f9f9f9"
        }}>
          <CardElement />
        </div>
      </div>

      {error && (
        <div style={{ color: "#d32f2f", marginBottom: "15px", fontSize: "14px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Odustani
        </button>
        <button
          type="submit"
          disabled={loading || !stripe}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Procesira se..." : "Plaćaj sada"}
        </button>
      </div>
    </form>
  );
}

const styles = {
  container: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "30px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#333",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  },
  buttonGroup: {
    display: "flex",
    gap: "5px",
  },
  navButton: {
    backgroundColor: "#333",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.2s",
  },
  navIcon: {
    fontSize: "18px",
  },
  weekTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#333",
    margin: 0,
  },
  todayButton: {
    backgroundColor: "#333",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "14px",
  },
  calendarWrapper: {
    overflowX: "auto",
    marginBottom: "20px",
  },
  calendarContainer: {
    minWidth: "800px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    userSelect: "none",
  },
  timeHeader: {
    width: "80px",
    backgroundColor: "#f5f5f5",
    border: "1px solid #e0e0e0",
    padding: "10px",
  },
  dayHeader: {
    backgroundColor: "#f5f5f5",
    border: "1px solid #e0e0e0",
    padding: "12px 8px",
    textAlign: "center",
    fontWeight: "600",
    color: "#333",
  },
  todayHeader: {
    backgroundColor: "#3498db",
    color: "white",
  },
  dayHeaderContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  dayName: {
    fontSize: "14px",
    fontWeight: "600",
  },
  dayDate: {
    fontSize: "12px",
    opacity: 0.9,
  },
  timeRow: {
    height: "20px",
  },
  timeCell: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #e0e0e0",
    padding: "8px",
    textAlign: "right",
    verticalAlign: "top",
    width: "80px",
  },
  timeLabel: {
    fontSize: "13px",
    color: "#666",
    fontWeight: "500",
  },
  slotCell: {
    border: "1px solid #e0e0e0",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "background-color 0.1s",
    position: "relative",
  },
  todayColumn: {
    // Dodaj samo border, ne menjaj backgroundColor jer to prekriva rezervirane slotove
    borderLeft: "3px solid #3498db",
    borderRight: "3px solid #3498db",
  },
  reservedSlot: {
    backgroundColor: "#f01111",
    cursor: "not-allowed",
  },
  selectedSlot: {
    backgroundColor: "#3498db",
  },
  pastSlot: {
    backgroundColor: "#f5f5f5",
    cursor: "not-allowed",
    opacity: 0.6,
  },
  reservedIndicator: {
    width: "100%",
    height: "100%",
  },
  legend: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap",
    padding: "15px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },
  legendBox: {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
  },
  selectionInfo: {
    backgroundColor: "#ecf0f1",
    padding: "20px",
    borderRadius: "8px",
    marginTop: "20px",
  },
  selectionText: {
    margin: "0 0 15px 0",
    fontSize: "16px",
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  clearButton: {
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  reserveButton: {
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "30px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  },
  successIcon: {
    fontSize: "48px",
    color: "#27ae60",
    textAlign: "center",
    marginBottom: "15px",
  },
  successTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#27ae60",
    textAlign: "center",
    marginBottom: "15px",
  },
  successText: {
    fontSize: "16px",
    color: "#333",
    textAlign: "center",
    marginBottom: "25px",
    whiteSpace: "pre-line",
    lineHeight: "1.6",
  },
  successButton: {
    width: "100%",
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};

export default ParkingReservationCalendar;