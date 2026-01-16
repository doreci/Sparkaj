import "./editprofilepage.css";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

function EditProfilePage() {
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
            const response = await fetch("http://localhost:8080/api/user", {
                credentials: "include",
            });
            const data = await response.json();
            if (data.authenticated) {
                setUser(data);
                
                // Postavi formData sa podacima iz OAuth2
                setFormData({
                    ime: data.given_name || "",
                    prezime: data.family_name || "",
                    broj_mobitela: "",
                    profile_image_url: data.picture || "",
                });

                if (data.picture) {
                    setProfileImage(data.picture);
                } else {
                    console.log("Nema URLa za sliku");
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
            const dbPayload = {
                ime: formData.ime,
                prezime: formData.prezime,
                broj_mobitela: formData.broj_mobitela,
                profilna: formData.profile_image_url || "",
            };

            const userEmail = user.email;

            let orFilter = `email.eq.${userEmail}`;

            let existing = null;
            let selectErr = null;
            if (orFilter) {
                const selectRes = await supabase
                    .from("korisnik")
                    .select("uuid,email")
                    .or(orFilter)
                    .limit(1);

                existing = selectRes.data;
                selectErr = selectRes.error;
            }

            if (selectErr) {
                console.warn(
                    "Greška pri provjeri postojanja korisnika:",
                    selectErr
                );
            }

            if (existing && Array.isArray(existing) && existing.length > 0) {
                const found = existing[0];
                const updateBy = { column: "email", value: userEmail };

                const { data: updatedData, error: updateErr } = await supabase
                    .from("korisnik")
                    .update(dbPayload)
                    .eq(updateBy.column, updateBy.value)
                    .select();

                // console.log('Ažuriaj korisnika:', updateBy.column, { updatedData, updateErr });

                if (updateErr) {
                    console.error("Greška pri ažuriranju:", updateErr);
                    throw updateErr;
                }
            } else {
                const upsertPayload = {
                    email: userEmail,
                    ...dbPayload,
                };

                const { data: upsertData, error: upsertErr } = await supabase
                    .from("korisnik")
                    .upsert(upsertPayload, {
                        onConflict: "email",
                        returning: "representation",
                    });

                if (upsertErr) {
                    console.error("Greška pri dodavanju korisnika:", upsertErr);
                    throw upsertErr;
                }
            }
        } catch (error) {
            console.error("Greška pri spremanju promjena:", error.message);
        }
    };

    return (
        <div className="container">
            {profileImage &&
                console.log("DEBUG: profileImage state:", profileImage)}
            {formData.profile_image_url &&
                console.log(
                    "DEBUG: formData.profile_image_url:",
                    formData.profile_image_url
                )}
            <div className="header">
                <img src="./logo.png" alt="logo" />
            </div>
            <div className="title">Uređivanje osobnih podataka</div>

            <div className="content-wrapper">
                <div className="profile-section">
                    <div className="profilna">
                        <img
                            src={profileImage}
                            alt="Profilna slika"
                            onError={(e) => {
                                console.error(
                                    "Greška pri učitavanju slike:",
                                    e.target.src
                                );
                                e.target.src = "./avatar-icon.png"; // Fallback ako URL nije dostupan
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
                        <input
                            type="text"
                            id="broj_mobitela"
                            className="broj_mobitela"
                            value={formData.broj_mobitela}
                            onChange={handleInputChange}
                        />
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