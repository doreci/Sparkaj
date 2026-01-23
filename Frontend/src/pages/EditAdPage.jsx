import "./createadpage.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function EditAdPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [imagePreview, setImagePreview] = useState("./parking-placeholder.png");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [adData, setAdData] = useState(null);

    const [formData, setFormData] = useState({
        naziv_oglasa: "",
        opis_oglasa: "",
        lokacija: "",
        cijena: "",
        slika: null
    });

    useEffect(() => {
        checkAuthentication();
    }, []);

    useEffect(() => {
        if (isAuthenticated && session) {
            loadAdData();
        }
    }, [isAuthenticated, id]);

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
                navigate("/login");
            }
        } catch (error) {
            // console.log("Korisnik nije autentificiran");
            setIsAuthenticated(false);
            navigate("/login");
        }
    };

    const loadAdData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/oglasi/${id}`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Oglas nije pronađen");
            }

            const ad = await response.json();

            // Provjeri je li trenutni korisnik vlasnik oglasa
            if (ad.id_korisnika !== session?.id_korisnika) {
                alert("Nemate dozvolu za uređivanje ovog oglasa");
                navigate("/");
                return;
            }

            setAdData(ad);
            
            const lokacija = `${ad.ulica_broj}, ${ad.postanski_broj}, ${ad.grad}`;
            setFormData({
                naziv_oglasa: ad.naziv_oglasa || "",
                opis_oglasa: ad.opis_oglasa || "",
                lokacija: lokacija,
                cijena: ad.cijena || "",
                slika: null
            });

            if (ad.slika) {
                setImagePreview(ad.slika);
            }
        } catch (error) {
            console.error("Greška pri učitavanju oglasa:", error);
            alert("Greška pri učitavanju oglasa: " + error.message);
            navigate("/");
        } finally {
            setIsLoading(false);
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

    const handleUpdateAd = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            alert("Nisi prijavljen!");
            return;
        }

        setIsSubmitting(true);

        const safetyTimeout = setTimeout(() => setIsSubmitting(false), 15000);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); 

        try {
            const lokacijaParts = formData.lokacija.split(',').map(s => s.trim());
            if (lokacijaParts.length !== 3) {
                alert("Lokacija mora biti u formatu: Ulica broj, postanski broj, grad");
                setIsSubmitting(false);
                return;
            }
            const ulicaBroj = lokacijaParts[0];
            const postanskiBroj = parseInt(lokacijaParts[1]);
            const grad = lokacijaParts[2];

            if (isNaN(postanskiBroj)) {
                alert("Postanski broj mora biti broj");
                setIsSubmitting(false);
                return;
            }

            let imageUrl = adData.slika;
            if (formData.slika) {
                const fileName = `ads/${Date.now()}_${formData.slika.name}`;
                const { data, error } = await supabase.storage
                    .from('slika_oglasa')
                    .upload(fileName, formData.slika);

                if (error) {
                    console.error("Error uploading image:", error);
                    alert("Greška pri uploadu slike: " + error.message + ". Slika neće biti ažurirana.");
                } else {
                    const { data: urlData } = supabase.storage
                        .from('slika_oglasa')
                        .getPublicUrl(fileName);
                    imageUrl = urlData.publicUrl;
                }
            }

            const payload = {
                naziv_oglasa: formData.naziv_oglasa,
                opis_oglasa: formData.opis_oglasa,
                cijena: parseFloat(formData.cijena) || null,
                grad: grad,
                ulica_broj: ulicaBroj,
                postanski_broj: postanskiBroj,
                slika: imageUrl
            };

            // console.log("Update payload:", payload);

            const response = await fetch(`${API_URL}/api/oglasi/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            // console.log("Response status:", response.status);

            if (response.ok) {
                // console.log("Oglas uspješno ažuriran!");
                alert("Oglas uspješno ažuriran!");
                navigate(`/ad/${id}`);
            } else {
                const errorText = await response.text();
                console.error("Greška pri ažuriranju oglasa:");
                console.error("Status:", response.status);
                console.error("Error text:", errorText);
                
                try {
                    const errorData = JSON.parse(errorText);
                    alert("Greška pri ažuriranju oglasa: " + errorData.error);
                } catch {
                    alert("Greška pri ažuriranju oglasa [" + response.status + "]: " + errorText);
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                alert("Zahtjev je istekao. Pokušajte ponovo.");
            } else {
                console.error("Network error:", error);
                alert("Mrežna greška: " + error.message);
            }
        } finally {
            setIsSubmitting(false);
            clearTimeout(timeoutId);
            clearTimeout(safetyTimeout);
        }
    };

    const handleDeleteAd = async () => {
        if (!window.confirm("Jeste li sigurni da želite obrisati ovaj oglas? Ova akcija se ne može vratiti.")) {
            return;
        }

        setIsDeleting(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`${API_URL}/api/oglasi/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                signal: controller.signal,
            });

            // console.log("Delete response status:", response.status);

            if (response.ok) {
                // console.log("Oglas uspješno obrisan!");
                alert("Oglas uspješno obrisan!");
                navigate("/");
            } else {
                const errorText = await response.text();
                console.error("Greška pri brisanju oglasa:");
                console.error("Status:", response.status);
                console.error("Error text:", errorText);
                
                try {
                    const errorData = JSON.parse(errorText);
                    if(errorData.error.includes("CONFLICT")) {
                        alert("Oglas ne može biti obrisan jer ima aktivne rezervacije.");
                    }
                    else alert("Greška pri brisanju oglasa: " + errorData.error);
                } catch {
                    alert("Greška pri brisanju oglasa [" + response.status + "]: " + errorText);
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                alert("Zahtjev je istekao. Pokušajte ponovo.");
            } else {
                console.error("Network error:", error);
                alert("Mrežna greška: " + error.message);
            }
        } finally {
            setIsDeleting(false);
            clearTimeout(timeoutId);
        }
    };

    if (isLoading) {
        return (
            <div className="container">
                <div className="header">
                    <img src="./logo.png" alt="logo" />
                </div>
                <div className="title">Učitavanje...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="container">
                <div className="header">
                    <img src="./logo.png" alt="logo" />
                </div>
                <div className="title">Greška</div>
                <div className="content-wrapper">
                    <p>Trebas biti prijavljen za uređivanje oglasa.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <div className="header-logo">
                    <img name="logo" src="/logo.png" alt="logo" />
                </div>
            </div>

            <div className="title">Uređivanje oglasa</div>

            <div className="content-wrapper">

                <div className="profile-section">
                    <div className="ad-image">
                        <img src={imagePreview} alt="" />
                    </div>

                    <div className="prijenos">
                        <label htmlFor="file-upload" style={{cursor: 'pointer'}}>
                            Promijeni sliku parkinga
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

                <form onSubmit={handleUpdateAd}>
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
                            {isSubmitting ? "Ažuriranje..." : "Ažuriraj oglas"}
                        </button>
                    </div>
                </form>

                <div className="delete-section" style={{marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd'}}>
                    <h3 style={{color: '#d32f2f', marginBottom: '10px'}}>Opasna akcija</h3>
                    <p style={{marginBottom: '15px'}}>Brisanjem oglasa ne možete ga vratiti.</p>
                    <button 
                        onClick={handleDeleteAd} 
                        disabled={isDeleting}
                        style={{
                            backgroundColor: '#d32f2f',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            opacity: isDeleting ? 0.7 : 1
                        }}
                    >
                        {isDeleting ? "Brisanje..." : "Obriši oglas"}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default EditAdPage;
