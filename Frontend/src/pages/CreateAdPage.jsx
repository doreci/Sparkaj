
import "./createadpage.css";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function CreateAdPage() {

    const [session, setSession] = useState(null);
    const [imagePreview, setImagePreview] = useState("./parking-placeholder.png");

    const [formData, setFormData] = useState({
        naziv_oglasa: "",
        opis_oglasa: "",
        lokacija: "",
        slika: null
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
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

        const payload = {
            naziv_oglasa: formData.naziv_oglasa,
            opis_oglasa: formData.opis_oglasa,
            id_korisnika: session.user.id,
            // cijena i prosj_ocjena se NE šalju
        };

        console.log("Oglas payload:", payload);
        console.log("Lokacija:", formData.lokacija);
        console.log("Slika:", formData.slika);

        // Ovdje ćeš kasnije povezati upload slike i insert u bazu
        alert("Oglas spremljen (demo)");
    };

    return (
        <div className="container">
            <div className="header">
                <img src="./logo.png" alt="logo" />
            </div>

            <div className="title">Izrada oglasa</div>

            <div className="content-wrapper">

                <div className="profile-section">
                    <div className="profilna">
                        <img src={imagePreview} alt="Slika parkinga" />
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
                        <label htmlFor="lokacija">Lokacija</label>
                        <input type="text" id="lokacija" value={formData.lokacija} onChange={handleInputChange} />
                    </div>

                    <div className="submit-button">
                        <button type="submit">
                            Spremi oglas
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default CreateAdPage;