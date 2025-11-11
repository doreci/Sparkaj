
import "./editprofilepage.css"
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function EditProfilePage() {

    const [session, setSession] = useState(null);
    const [profileImage, setProfileImage] = useState("./avatar-icon.png");
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        ime: "",
        prezime: "",
        broj_mobitela: "",
        profile_image_url: ""
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            
            if (session?.user) {
                const metadata = session.user.user_metadata;
                
                // DEBUG: Prikaži što je u metadata-u
                console.log("Auth metadata (Edit Profile useEffect):", metadata);
                
                // Učitaj ime i prezime
                let ime = "";
                let prezime = "";
                
                // Ako su odvojeno pohranjena, koristi ih
                if (metadata?.ime && metadata?.prezime) {
                    ime = metadata.ime;
                    prezime = metadata.prezime;
                } else if (metadata?.full_name) {
                    // Inače splitaj full_name
                    const nameParts = metadata.full_name.trim().split(/\s+/);
                    ime = nameParts[0] || "";
                    prezime = nameParts.slice(1).join(" ") || "";
                } else if (metadata?.name) {
                    // Ili splitaj name kao fallback
                    const nameParts = metadata.name.trim().split(/\s+/);
                    ime = nameParts[0] || "";
                    prezime = nameParts.slice(1).join(" ") || "";
                }
                
                // Učitaj sve dostupne podatke
                setFormData({
                    ime: ime,
                    prezime: prezime,
                    broj_mobitela: metadata?.broj_mobitela || "",
                    profile_image_url: metadata?.profile_image_url || ""
                });
                
                // Učitaj sliku ako postoji
                if (metadata?.profile_image_url) {
                    console.log("Učitavanje slike iz metadata.profile_image_url:", metadata.profile_image_url);
                    setProfileImage(metadata.profile_image_url);
                } else if (metadata?.avatar_url) {
                    console.log("Učitavanje slike iz metadata.avatar_url:", metadata.avatar_url);
                    setProfileImage(metadata.avatar_url);
                } else {
                    console.log("Nema URL-a za sliku u metadata-u");
                }
            }
        });
    }, []);
    
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file && session?.user?.id) {
            try {
                setUploading(true);
                
                // Prikaži preview slike
                const reader = new FileReader();
                reader.onloadend = () => {
                    setProfileImage(reader.result);
                };
                reader.readAsDataURL(file);

                // Spremi sliku u Supabase Storage
                const BUCKET = 'profilne';
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                // filePath ide u per-user folder; RLS policy dozvoljava upload samo ako auth.uid() = prvi dio path-a
                const filePath = `${session.user.id}/avatars/${fileName}`;

                // Provjera postoji li bucket (poboljšano logiranje korisniku)
                try {
                    const { data: listData, error: listError } = await supabase.storage.from(BUCKET).list('', { limit: 1 });
                    if (listError) {
                        console.error('Greška pri provjeri bucket-a:', listError);
                        if (String(listError.message).toLowerCase().includes('bucket not found')) {
                            alert(`Bucket '${BUCKET}' ne postoji. Otvori Supabase Storage i kreiraj bucket s tim imenom.`);
                            setUploading(false);
                            return;
                        }
                    }
                } catch (checkErr) {
                    console.error('Exception pri provjeri bucket-a:', checkErr);
                }

                const { data, error: uploadError } = await supabase.storage
                    .from(BUCKET)
                    .upload(filePath, file);

                // Log full upload response for debugging
                console.log('Supabase storage upload response:', { data, uploadError });

                if (uploadError) {
                    console.error('Upload error details:', uploadError, data);
                    throw uploadError;
                }

                // Preuzmi javnu URL slike
                const { data: { publicUrl } } = supabase.storage
                    .from(BUCKET)
                    .getPublicUrl(filePath);

                // Ažuriraj user metadata sa URL slike
                const { error: updateError } = await supabase.auth.updateUser({
                    data: { 
                        profile_image_url: publicUrl
                    }
                });

                if (updateError) throw updateError;

                // Ažuriraj state za prikaz i spremi URL
                setProfileImage(publicUrl);
                setFormData(prev => ({
                    ...prev,
                    profile_image_url: publicUrl
                }));

                console.log("Slika je uspješno učitana!", { publicUrl });
            } catch (error) {
                // Log the full error object to capture HTTP response details
                console.error("Greška pri učitavanju slike:", error);
            } finally {
                setUploading(false);
            }
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        
        if (!session?.user?.id) {
            console.error("Nema aktivne sesije");
            return;
        }

        try {
            // Kombinuj ime i prezime u full_name
            const fullName = `${formData.ime} ${formData.prezime}`.trim();
            
            // 1. Ažuriraj user metadata u auth
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    name: formData.ime,
                    prezime: formData.prezime,
                    broj_mobitela: formData.broj_mobitela,
                    profile_image_url: formData.profile_image_url
                }
            });

            if (authError) throw authError;

            // 2. Spremi u bazu podataka (tablica 'korisnici') koristeći upsert
            // Koristimo upsert da ubacimo redak ako ne postoji ili ažuriramo ako postoji.
            // Također logiramo cijeli odgovor za bolju dijagnostiku HTTP 400 grešaka.
            const payload = {
                // Use user_id (uuid) column in the DB to reference auth user id
                uuid: session.user.id,
                ime: formData.ime,
                prezime: formData.prezime,
                broj_mobitela: formData.broj_mobitela,
                profilna: formData.profile_image_url,
            };

            // Pokušaj upserta koristeći conflict target.
            // Greška koju si dobio pokazuje constraint "korisnici_uuid_key" —
            // zato koristimo 'uuid' kao onConflict kolonu. Ako tvoja jedinstvena kolona
            // ima drugo ime (npr. user_id), zamijeni 'uuid' odgovarajućim imenom.
            let dbData = null;
            let dbError = null;
            try {
                const res = await supabase
                    .from('korisnici')
                    .upsert(payload, { onConflict: 'uuid', returning: 'representation' });
                dbData = res.data;
                dbError = res.error;
            } catch (err) {
                // netočno voli se vratiti kroz res.error, ali hvataj i iznimke
                dbError = err;
            }

            if (dbError) {
                console.error('Greška pri upsert u tabelu korisnici:', dbError);

                // Ako je duplicate key (23505), pokušaj raditi update umjesto insert
                if (dbError.code === '23505' || (dbError.details && dbError.details.includes('already exists'))) {
                    try {
                        // Update postojeći red prema uuid koloni
                        const { data: updatedData, error: updateErr } = await supabase
                            .from('korisnici')
                            .update({
                                ime: formData.ime,
                                prezime: formData.prezime,
                                broj_mobitela: formData.broj_mobitela,
                                profilna: formData.profile_image_url,
                            })
                            .eq('uuid', session.user.id)
                            .select();

                        if (updateErr) {
                            console.error('Greška pri update-u nakon 23505:', updateErr);
                        } else {
                            console.log('Uspješan update nakon 23505:', updatedData);
                        }
                    } catch (updateCatchErr) {
                        console.error('Exception pri pokušaju update-a nakon 23505:', updateCatchErr);
                    }
                }
            } else {
                console.log('Baza odgovor (korisnici upsert):', dbData);
            }

            console.log("Promjene su uspješno spremljene!");
            // Preusmjeri na početnu stranicu
            {/* window.location.href = '/'; */}
        } catch (error) {
            console.error("Greška pri spremanju promjena:", error.message);
        }
    };

    return (
        <div className="container">
            {/* DEBUG: Prikaži URL koji se koristi */}
            {profileImage && console.log("DEBUG: profileImage state:", profileImage)}
            {formData.profile_image_url && console.log("DEBUG: formData.profile_image_url:", formData.profile_image_url)}
            <div className="header">
                <img src="./logo.png" alt="logo" />
            </div>
            <div className="title">Uređivanje osobnih podataka</div>
            
            <div className="content-wrapper">
                
                <div className="profile-section">
                    <div className="profilna">
                        <img src={profileImage} alt="Profilna slika" onError={(e) => {
                            console.error("Greška pri učitavanju slike:", e.target.src);
                            e.target.src = "./avatar-icon.png"; // Fallback ako URL nije dostupan
                        }} />
                    </div>
                    <div className="prijenos">
                        <label htmlFor="file-upload" style={{cursor: 'pointer'}}>
                            Prenesi fotografiju
                        </label>
                        <input id="file-upload"
                               type="file"
                               accept="image/*"
                               onChange={handleImageUpload}
                               style={{display:'none'}} 
                        />
                    </div>
                </div>

                
                <form onSubmit={handleSaveChanges}>
                    <div className="form-group">
                        <label htmlFor="ime">Ime</label>
                        <input type="text" id="ime" className="ime" value={formData.ime} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="prezime">Prezime</label>
                        <input type="text" id="prezime" className="prezime" value={formData.prezime} onChange={handleInputChange} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="broj_mobitela">Broj mobitela</label>
                        <input type="text" id="broj_mobitela" className="broj_mobitela" value={formData.broj_mobitela} onChange={handleInputChange} />
                    </div>
                    
                    <div className="submit-button">
                        <button type="submit" disabled={uploading}>
                            {uploading ? "Učitavanje slike..." : "Spremi promjene"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditProfilePage;