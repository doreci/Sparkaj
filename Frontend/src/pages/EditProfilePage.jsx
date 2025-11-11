
import "./editprofilepage.css"
import { Link } from "react-router-dom";
import { useState } from "react";

function EditProfilePage() {

    const [profileImage, setProfileImage] = useState("./avatar-icon.png");
    
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <img src="./logo.png" alt="logo" />
            </div>
            <div className="title">Uređivanje osobnih podataka</div>
            
            <div className="content-wrapper">
                
                <div className="profile-section">
                    <div className="profilna">
                        <img src={profileImage} alt="" />
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

                
                <form action="">
                    <div className="form-group">
                        <label htmlFor="ime">Ime</label>
                        <input type="text" id="ime" className="ime" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="prezime">Prezime</label>
                        <input type="text" id="prezime" className="prezime" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="broj_mobitela">Broj mobitela</label>
                        <input type="text" id="broj_mobitela" className="broj_mobitela" />
                    </div>
                    
                    <div className="submit-button">
                        <Link to='/'>
                            <button>Spremi promjene</button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditProfilePage;