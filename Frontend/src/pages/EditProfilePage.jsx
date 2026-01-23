import "./editprofilepage.css";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { isAdmin, getProfileRoute } from "../utils/authHelpers";

const API_URL = `${import.meta.env.VITE_API_URL}`;

const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    if (url.startsWith('./') || url.startsWith('/')) {
        return true;
    }
    
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

function EditProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profileImage, setProfileImage] = useState("./avatar-icon.png");
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        ime: "",
        prezime: "",
        broj_mobitela: "",
        profile_image_url: "",
    });

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            const response = await fetch(`${API_URL}/api/user`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.authenticated) {
                // Provjeri je li admin i redirekcija na admin page
                if (isAdmin(data)) {
                    // console.log("✓ Admin, redirekcija na /admin");
                    navigate("/admin");
                    return;
                }
                
                setUser(data);
                
                let dbIme = data.given_name || "";
                let dbPrezime = data.family_name || "";
                let dbBrojMobitela = "";
                let dbProfilna = data.picture || "";

                try {
                    const dbResponse = await fetch(
                        `${API_URL}/api/user`,
                        {
                            credentials: "include",
                        }
                    );
                    const userResponse = await dbResponse.json();
                    
                    if (userResponse.id_korisnika) {
                        const profileResponse = await fetch(
                            `${API_URL}/api/korisnik/${userResponse.id_korisnika}`,
                            {
                                credentials: "include",
                            }
                        );
                        const dbData = await profileResponse.json();
                        if (dbData && dbData.ime) {
                            dbIme = dbData.ime || dbIme;
                            dbPrezime = dbData.prezime || dbPrezime;
                            dbBrojMobitela = dbData.broj_mobitela || "";
                            dbProfilna = dbData.profilna || dbProfilna;
                        }
                    }
                } catch (dbError) {
                    console.log("Nije pronađen korisnik u bazi, koristim OAuth2 podatke");
                }

                setFormData({
                    ime: dbIme,
                    prezime: dbPrezime,
                    broj_mobitela: dbBrojMobitela,
                    profile_image_url: dbProfilna,
                });

                if (dbProfilna && isValidImageUrl(dbProfilna)) {
                    setProfileImage(dbProfilna);
                } else {
                    // console.log("Nema URLa za sliku ili URL nije dostupan");
                    setProfileImage("./avatar-icon.png");
                }
            }
        } catch (error) {
            console.log("Korisnik nije autentificiran");
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file && user?.email) {
            try {
                setUploading(true);

                const reader = new FileReader();
                reader.onloadend = () => {
                    setProfileImage(reader.result);
                };
                reader.readAsDataURL(file);

                const BUCKET = "profilne";
                const fileExt = file.name.split(".").pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${user.email}/avatars/${fileName}`;

                try {
                    const { data: listData, error: listError } =
                        await supabase.storage
                            .from(BUCKET)
                            .list("", { limit: 1 });
                    if (listError) {
                        console.error(
                            "Greška pri provjeri bucket-a:",
                            listError
                        );
                        if (
                            String(listError.message)
                                .toLowerCase()
                                .includes("bucket not found")
                        ) {
                            alert(`Bucket '${BUCKET}' ne postoji.`);
                            setUploading(false);
                            return;
                        }
                    }
                } catch (checkErr) {
                    console.error("Exception pri provjeri bucket-a:", checkErr);
                }

                const { data: uploadData, error: uploadError } =
                    await supabase.storage
                        .from(BUCKET)
                        .upload(filePath, file, { upsert: true });

                // console.log('Supabase upload response:', uploadData, uploadError);

                if (uploadError) {
                    console.error("Upload greška:", uploadError);
                    throw uploadError;
                }

                const publicUrlResp = supabase.storage
                    .from(BUCKET)
                    .getPublicUrl(filePath);
                const publicUrlData = publicUrlResp?.data || {};
                let publicUrl =
                    publicUrlData.publicUrl ||
                    publicUrlData.url ||
                    publicUrlData.public_url;

                if (!publicUrl) {
                    try {
                        const { data: signedData, error: signedError } =
                            await supabase.storage
                                .from(BUCKET)
                                .createSignedUrl(filePath, 60 * 60);

                        if (signedError) {
                            console.warn("signedError:", signedError);
                        } else {
                            publicUrl =
                                signedData?.signedUrl ||
                                signedData?.signedURL ||
                                signedData?.url;
                        }
                    } catch (signErr) {
                        console.error("greška za signed URL:", signErr);
                    }
                }

                const { error: updateError } = await supabase.auth.updateUser({
                    data: {
                        profile_image_url: publicUrl || "",
                    },
                });

                if (updateError) throw updateError;

                setProfileImage(publicUrl || reader.result);
                setFormData((prev) => ({
                    ...prev,
                    profile_image_url: publicUrl || reader.result,
                }));

                // console.log('Slika je učitana:', { publicUrl });
            } catch (error) {
                console.error("Greška pri učitavanju slike:", error);
            } finally {
                setUploading(false);
            }
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();

        if (!user?.email) {
            console.error("Nema aktivne sesije");
            return;
        }

        try {
            const updatePayload = {
                ime: formData.ime,
                prezime: formData.prezime,
                broj_mobitela: formData.broj_mobitela,
                profile_image_url: formData.profile_image_url || "",
            };

            const response = await fetch(`${API_URL}/api/korisnik/profile/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(updatePayload),
            });

            const data = await response.json();

            if (data.success) {
                // console.log("Profil uspješno ažuriran");
                alert("Profil uspješno ažuriran");
                checkAuthentication();
            } else {
                console.error("Greška pri ažuriranju profila:", data.message);
                alert("Greška pri ažuriranju profila: " + data.message);
            }
        } catch (error) {
            console.error("Greška pri spremanju promjena:", error.message);
            alert("Greška pri spremanju promjena: " + error.message);
        }
    };

    return (
        <div className="container">
            {profileImage}
            {formData.profile_image_url}
            <div className="header">
                <Link to="/" className="back-link">
                    ← Nazad
                </Link>
            </div>
            <div className="title">Uređivanje osobnih podataka</div>

            <div className="content-wrapper">
                <div className="profile-section">
                    <div className="profilna">
                        <img
                            src={profileImage}
                            alt="Profilna slika"
                            loading="lazy"
                            crossOrigin="anonymous"
                            onError={(e) => {
                                if (e.target.src && (e.target.src.includes("lh3.googleusercontent") || e.target.src.includes("googleusercontent"))) {
                                    console.warn("Google slika nije dostupna, koristi fallback icon");
                                    e.target.src = "./avatar-icon.png";
                                } else {
                                    console.error("Greška pri učitavanju slike:", e.target.src);
                                    e.target.src = "./avatar-icon.png";
                                }
                            }}
                        />
                    </div>
                    <div className="prijenos">
                        <label
                            htmlFor="file-upload"
                            style={{ cursor: "pointer" }}
                        >
                            Prenesi fotografiju
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: "none" }}
                        />
                    </div>
                </div>

                <form onSubmit={handleSaveChanges}>
                    <div className="form-group">
                        <label htmlFor="ime">Ime</label>
                        <input
                            type="text"
                            id="ime"
                            className="ime"
                            value={formData.ime}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="prezime">Prezime</label>
                        <input
                            type="text"
                            id="prezime"
                            className="prezime"
                            value={formData.prezime}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="broj_mobitela">Broj mobitela</label>
                        <div className="broj-mobitela">
                            <span>+385 </span>
                            <input
                                type="text"
                                id="broj_mobitela"
                                className="broj_mobitela"
                                value={formData.broj_mobitela}
                                onChange={handleInputChange}
                                maxLength={9}
                            />
                        </div>
                    </div>

                    <div className="submit-button">
                        <button type="submit" name="submit" disabled={uploading}>
                            {uploading
                                ? "Učitavanje slike..."
                                : "Spremi promjene"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="footer">
                <p>&copy; 2025 Sparkaj. All rights reserved.</p>
            </div>
        </div>
    );
}

export default EditProfilePage;