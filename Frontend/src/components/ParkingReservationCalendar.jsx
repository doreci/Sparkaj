import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function ParkingReservationCalendar({ oglasId, userId }) {
  const [reservations, setReservations] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleSlotClick = (date, hour) => {
    if (isSlotReserved(date, hour)) return;

    const slotKey = `${date.toDateString()}-${hour}`;
    
    if (selectedSlots.includes(slotKey)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotKey));
    } else {
      setSelectedSlots([...selectedSlots, slotKey]);
    }
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
        setSelectedSlots([...selectedSlots, slotKey]);
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

    setLoading(true);
    try {
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

      // Kreiraj rezervacije
      const insertPromises = reservationsToCreate.map(group => {
        const startDate = new Date(group[0].date);
        startDate.setHours(group[0].hour, 0, 0, 0);

        const endDate = new Date(group[group.length - 1].date);
        endDate.setHours(group[group.length - 1].hour + 1, 0, 0, 0);

        return supabase
          .from("Rezervacija")
          .insert([
            {
              id_korisnika: userId,
              id_oglasa: oglasId,
              datumOd: startDate.toISOString(),
              datumDo: endDate.toISOString(),
            },
          ]);
      });

      const results = await Promise.all(insertPromises);
      
      const hasError = results.some(result => result.error);
      if (hasError) {
        throw new Error("Greška pri kreiranju neke od rezervacija");
      }

      alert("Rezervacija uspješno kreirana!");
      setSelectedSlots([]);
      fetchReservations();
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
                          ...(reserved ? styles.reservedSlot : {}),
                          ...(selected ? styles.selectedSlot : {}),
                          ...(isPast && !reserved ? styles.pastSlot : {}),
                          ...(isToday(day) ? styles.todayColumn : {}),
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
          <span>Dostupno</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendBox, backgroundColor: "#f01111" }}></div>
          <span>Rezervirano</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendBox, backgroundColor: "#3498db" }}></div>
          <span>Odabrano</span>
        </div>
      </div>

      {selectedSlots.length > 0 && (
        <div style={styles.selectionInfo}>
          <p style={styles.selectionText}>
            <strong>Odabrano termina:</strong> {selectedSlots.length}
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
    </div>
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
    backgroundColor: "#f0f8ff",
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
};

export default ParkingReservationCalendar;