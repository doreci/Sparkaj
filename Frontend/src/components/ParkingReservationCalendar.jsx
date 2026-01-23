import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./ParkingReservationCalendar.css";

function ParkingReservationCalendar({ oglasId, userId, cijena, stripePromise }) {
  const [reservations, setReservations] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const hours = Array.from({ length: 24 }, (_, i) => i);

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

  const areSlotsContinuous = (slots) => {
    if (slots.length <= 1) return true;

    const sortedSlots = [...slots].sort((a, b) => {
      const [dateA, hourA] = a.split('-');
      const [dateB, hourB] = b.split('-');
      
      const dateObjA = new Date(dateA);
      const dateObjB = new Date(dateB);
      
      if (dateObjA.getTime() === dateObjB.getTime()) {
        return parseInt(hourA) - parseInt(hourB);
      }
      return dateObjA.getTime() - dateObjB.getTime();
    });

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const currentSlot = sortedSlots[i];
      const nextSlot = sortedSlots[i + 1];

      const [currentDateStr, currentHourStr] = currentSlot.split('-');
      const [nextDateStr, nextHourStr] = nextSlot.split('-');

      const currentHour = parseInt(currentHourStr);
      const nextHour = parseInt(nextHourStr);

      const currentDate = new Date(currentDateStr);
      const nextDate = new Date(nextDateStr);
      const currentTime = currentDate.getTime();
      const nextTime = nextDate.getTime();

      if (currentTime === nextTime) {
        if (nextHour !== currentHour + 1) {
          return false;
        }
      } else {
        if (currentHour !== 23 || nextHour !== 0) {
          return false;
        }
        
        // Provjeri je li razlika između datuma točno 1 dan
        const dayInMs = 24 * 60 * 60 * 1000;
        if (nextTime - currentTime !== dayInMs) {
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
      
      if (newSelectedSlots.length > 1 && !areSlotsContinuous(newSelectedSlots)) {
        alert("Brisanjem ovog termina nastaje rupa! Možete birati samo kontinuirane termine (bez praznih mjesta između)!");
        return;
      }
    } else {
      newSelectedSlots = [...selectedSlots, slotKey];
      
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
        
        if (areSlotsContinuous(newSelectedSlots)) {
          setSelectedSlots(newSelectedSlots);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePaymentSuccess = async () => {
    const startDate = new Date(selectedSlots[0].split('-')[0]);
    const endDate = new Date(selectedSlots[selectedSlots.length - 1].split('-')[0]);
    const message = `Plaćanje uspješno!\n\nRezervacija od ${startDate.toLocaleDateString('hr-HR')} do ${endDate.toLocaleDateString('hr-HR')}\nUkupno sati: ${selectedSlots.length}`;
    
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setSelectedSlots([]);
    await fetchReservations();
    setShowPaymentModal(false);
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

    setShowPaymentModal(true);
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
    <div className="parking-reservation-calendar" onMouseUp={handleMouseUp}>
      <h2>Kalendar rezervacija</h2>

      <div className="calendar-toolbar">
        <div className="button-group">
          <button onClick={goToPreviousWeek} className="nav-button">
            <span className="nav-icon">←</span>
          </button>
          <button onClick={goToNextWeek} className="nav-button">
            <span className="nav-icon">→</span>
          </button>
        </div>
        
        <h3 className="week-title">{formatDateRange()}</h3>
        
        <button onClick={goToToday} className="today-button">
          Danas
        </button>
      </div>

      <div className="calendar-wrapper">
        <div className="calendar-container">
          <table className="calendar-table">
            <thead>
              <tr>
                <th className="time-header"></th>
                {weekDays.map((day, index) => (
                  <th 
                    key={index} 
                    className={`day-header ${isToday(day) ? 'today' : ''}`}
                  >
                    <div className="day-header-content">
                      <span className="day-name">{dayNames[index].slice(0, 3)}</span>
                      <span className="day-date">{day.getDate()}.{day.getMonth() + 1}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour} className="time-row">
                  <td className="time-cell">
                    <span className="time-label">{hour}:00</span>
                  </td>
                  {weekDays.map((day, dayIndex) => {
                    const reserved = isSlotReserved(day, hour);
                    const selected = isSlotSelected(day, hour);
                    const isPast = new Date(day).setHours(hour, 0, 0, 0) < new Date();

                    return (
                      <td
                        key={dayIndex}
                        className={`slot-cell ${isToday(day) ? 'today' : ''} ${isPast && !reserved ? 'past' : ''} ${reserved ? 'reserved' : ''} ${selected ? 'selected' : ''}`}
                        onMouseDown={() => !isPast && handleMouseDown(day, hour)}
                        onMouseEnter={() => !isPast && handleMouseEnter(day, hour)}
                        title={reserved ? "Rezervirano" : selected ? "Odabrano" : "Dostupno"}
                      >
                        {reserved && (
                          <div className="reserved-indicator"></div>
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

      <div className="legend">
        <div className="legend-item">
          <div className="legend-box legend-available"></div>
          <span className="legend-available-text">Dostupno</span>
        </div>
        <div className="legend-item">
          <div className="legend-box legend-reserved"></div>
          <span className="legend-reserved-text">Rezervirano</span>
        </div>
        <div className="legend-item">
          <div className="legend-box legend-selected"></div>
          <span className="legend-selected-text">Odabrano</span>
        </div>
      </div>

      {selectedSlots.length > 0 && (
        <div className="selection-info">
          <p className="selection-text">
            <strong>Odabrano termina: {selectedSlots.length}</strong> 
          </p>
          <div className="action-buttons">
            <button
              onClick={() => setSelectedSlots([])}
              className="clear-button"
            >
              Poništi odabir
            </button>
            <button
              onClick={handleReservation}
              disabled={loading}
              className="reserve-button"
            >
              {loading ? "Rezerviram..." : "Potvrdi rezervaciju"}
            </button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Potvrdi plaćanje za rezervaciju</h3>
            <p><strong>Broj sati:</strong> {selectedSlots.length}</p>
            <p><strong>Cijena po satu:</strong> {cijena} €</p>
            <p className="modal-total-price">
              <strong>Ukupno:</strong> {(selectedSlots.length * cijena).toFixed(2)} €
            </p>
            
            {stripePromise && (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  amount={selectedSlots.length * cijena}
                  oglasId={oglasId}
                  userId={userId}
                  selectedSlots={selectedSlots}
                  cijena={cijena}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPaymentModal(false)}
                />
              </Elements>
            )}
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="success-icon">✓</div>
            <h3 className="success-title">Plaćanje uspješno!</h3>
            <p className="success-text">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="success-button"
            >
              Zatvori
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StripePaymentForm({ amount, oglasId, userId, selectedSlots, cijena, onSuccess, onCancel }) {
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
      const API_BASE_URL = ''; 
      
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

      const { clientSecret, paymentIntentId } = await response.json();

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === "succeeded") {
        // console.log("Payment successful:", paymentIntent);
        
        const sortedSlots = selectedSlots.sort();
        const confirmPayload = {
          paymentIntentId: paymentIntent.id,
          oglasId: parseInt(oglasId),
          korisnikId: parseInt(userId),
          iznos: amount,
          selectedSlots: sortedSlots, 
          cijena: cijena,
        };

        // console.log("Sending confirm-payment with payload:", confirmPayload);

        const confirmResponse = await fetch(`${API_BASE_URL}/api/payments/confirm-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(confirmPayload),
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json().catch(() => ({}));
          console.error("Confirm payment error response:", errorData);
          console.error("Full response status:", confirmResponse.status, confirmResponse.statusText);
          throw new Error(`Failed to confirm payment: ${confirmResponse.statusText}`);
        }

        const confirmData = await confirmResponse.json();
        // console.log("Payment confirmed and transaction saved:", confirmData);
        
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
      <div className="stripe-form-group">
        <label className="stripe-form-label">
          Kartični podaci
        </label>
        <div className="stripe-form-input">
          <CardElement />
        </div>
      </div>

      {error && (
        <div className="stripe-form-error">
          {error}
        </div>
      )}

      <div className="payment-button-group">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="cancel-button"
        >
          Odustani
        </button>
        <button
          type="submit"
          disabled={loading || !stripe}
          className="pay-button"
        >
          {loading ? "Procesira se..." : "Plaćaj sada"}
        </button>
      </div>
    </form>
  );
}

export default ParkingReservationCalendar;