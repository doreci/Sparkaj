
import "./createadpage.css";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function CreateAdPage() {

    const [session, setSession] = useState(null);
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
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                // Parse name into ime and prezime
                const fullName = session.user.user_metadata?.name || session.user.email || 'Unknown';
                const nameParts = fullName.split(' ');
                const ime = nameParts[0] || 'Unknown';
                const prezime = nameParts.slice(1).join(' ') || null;

                // Upsert korisnik
                supabase.from('korisnik').upsert({
                    uuid: session.user.id,
                    ime: ime,
                    prezime: prezime,
                    email: session.user.email
                }, { onConflict: 'uuid' }).then(({ error }) => {
                    if (error) console.error('Error upserting korisnik:', error);
                });
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            if (event === 'SIGNED_IN' && session?.user) {
                // Parse name into ime and prezime
                const fullName = session.user.user_metadata?.name || session.user.email || 'Unknown';
                const nameParts = fullName.split(' ');
                const ime = nameParts[0] || 'Unknown';
                const prezime = nameParts.slice(1).join(' ') || null;

                // Upsert korisnik on sign in
                const { error } = await supabase.from('korisnik').upsert({
                    uuid: session.user.id,
                    ime: ime,
                    prezime: prezime,
                    email: session.user.email
                }, { onConflict: 'uuid' });
                if (error) console.error('Error upserting korisnik:', error);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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

        if (!session?.user?.id) {
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

        // Get korisnik uuid
        const uuid = session.user.id;

        const payload = {
            naziv_oglasa: formData.naziv_oglasa,
            opis_oglasa: formData.opis_oglasa,
            cijena: parseFloat(formData.cijena) || null,
            grad: grad,
            ulica_broj: ulicaBroj,
            postanski_broj: postanskiBroj,
            slika: imageUrl,
            uuid: uuid,
        };

        console.log("Oglas payload:", payload);

        try {
            const response = await fetch('http://localhost:8080/api/oglasi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (response.ok) {
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
                console.error("Error creating ad:", errorText);
                alert("Greška pri spremanju oglasa: " + errorText);
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
        </div>
    );
}

export default CreateAdPage;