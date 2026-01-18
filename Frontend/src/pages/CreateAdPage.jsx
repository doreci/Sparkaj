
import "./createadpage.css";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const API_URL = "http://localhost:8080";

function CreateAdPage() {

    const [session, setSession] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [imagePreview, setImagePreview] = useState("./parking-placeholder.png");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        naziv_oglasa: "",
        opis_oglasa: "",
        lokacija: "",
        cijena: "",
        slika: null
    });

    useEffect(() => {
        // Provjeri OAuth2 autentifikaciju
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            const response = await fetch(`${API_URL}/api/user`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.authenticated) {
                setSession(data);
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.log("Korisnik nije autentificiran");
            setIsAuthenticated(false);
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, slika: file }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateAd = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            alert("Nisi prijavljen!");
            return;
        }

        setIsSubmitting(true);

        // Safety timeout to reset button after 15 seconds
        const safetyTimeout = setTimeout(() => setIsSubmitting(false), 15000);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

        // Parse lokacija: "Ulica broj, postanski, grad"
        const lokacijaParts = formData.lokacija.split(',').map(s => s.trim());
        if (lokacijaParts.length !== 3) {
            alert("Lokacija mora biti u formatu: Ulica broj, postanski broj, grad");
            return;
        }
        const ulicaBroj = lokacijaParts[0];
        const postanskiBroj = parseInt(lokacijaParts[1]);
        const grad = lokacijaParts[2];

        if (isNaN(postanskiBroj)) {
            alert("Postanski broj mora biti broj");
            return;
        }

        let imageUrl = null;
        if (formData.slika) {
            // Upload image to Supabase storage
            const fileName = `ads/${Date.now()}_${formData.slika.name}`;
            const { data, error } = await supabase.storage
                .from('slika_oglasa')
                .upload(fileName, formData.slika);

            if (error) {
                console.error("Error uploading image:", error);
                alert("Greška pri uploadu slike: " + error.message + ". Slika neće biti spremljena.");
                // Continue without image
            } else {
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('slika_oglasa')
                    .getPublicUrl(fileName);
                imageUrl = urlData.publicUrl;
            }
        }

        // Backend će preuzeti id_korisnika iz OAuth2 autentifikacije
        const payload = {
            naziv_oglasa: formData.naziv_oglasa,
            opis_oglasa: formData.opis_oglasa,
            cijena: parseFloat(formData.cijena) || null,
            grad: grad,
            ulica_broj: ulicaBroj,
            postanski_broj: postanskiBroj,
            slika: imageUrl,
            uuid: session?.id || session?.uuid || "",
        };

        console.log("Oglas payload:", payload);

        try {
            const response = await fetch(`${API_URL}/api/oglasi`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);

            if (response.ok) {
                console.log("✓ Oglas uspješno kreiran!");
                alert("Oglas uspješno spremljen!");
                // Reset form or redirect
                setFormData({
                    naziv_oglasa: "",
                    opis_oglasa: "",
                    lokacija: "",
                    cijena: "",
                    slika: null
                });
                setImagePreview("./parking-placeholder.png");
                setImagePreview("./parking-placeholder.png");
            } else {
                const errorText = await response.text();
                console.error("✗ Greška pri spremanju oglasa:");
                console.error("Status:", response.status);
                console.error("Error text:", errorText);
                alert("Greška pri spremanju oglasa [" + response.status + "]: " + errorText);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                alert("Zahtjev je istekao. Pokušajte ponovo.");
            } else {
                console.error("Network error:", error);
                alert("Mrežna greška");
            }
        } finally {
            setIsSubmitting(false);
            clearTimeout(timeoutId);
            clearTimeout(safetyTimeout);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <img src="./logo.png" alt="logo" />
            </div>

            <div className="title">Izrada oglasa</div>

            {!isAuthenticated ? (
                <div className="content-wrapper">
                    <p>Trebas biti prijavljen da kreirajš oglas. Molimo prijavi se prvo.</p>
                </div>
            ) : (
            <div className="content-wrapper">

                <div className="profile-section">
                    <div className="ad-image">
                        <img src={imagePreview} alt="" />
                    </div>

                    <div className="prijenos">
                        <label htmlFor="file-upload" style={{cursor: 'pointer'}}>
                            Dodaj sliku parkinga
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{display:'none'}}
                        />
                    </div>
                </div>

                <form onSubmit={handleCreateAd}>
                    <div className="form-group">
                        <label htmlFor="naziv_oglasa">Naziv oglasa</label>
                        <input type="text" id="naziv_oglasa" value={formData.naziv_oglasa} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="opis_oglasa">Opis oglasa</label>
                        <input type="text" id="opis_oglasa" value={formData.opis_oglasa} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="cijena">Cijena</label>
                        <input type="number" id="cijena" value={formData.cijena} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lokacija">Lokacija</label>
                        <input type="text" id="lokacija" value={formData.lokacija} onChange={handleInputChange} />
                    </div>

                    <div className="submit-button">
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Spremanje..." : "Spremi oglas"}
                        </button>
                    </div>
                </form>

            </div>
            )}
        </div>
    );
}

export default CreateAdPage;