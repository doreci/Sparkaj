import { Link } from "react-router-dom";
import "./adCard.css";

function AdCard({ ad }) {
    if (!ad) return null;

    const ocjena = ad.prosj_ocjena ? ad.prosj_ocjena.toFixed(1) : "N/A";
    const naziv = ad.naziv_oglasa || "Oglas bez naziva";
    const slika = ad.korisnik?.profilna || "/placeholder.png";

    return (
        <Link to={`/ad/${ad.id_oglasa}`} className="ad-card-link">
            <div className="ad-card">
                {/* Slika */}
                <div className="ad-card-image">
                    <img
                        src={slika}
                        alt={naziv}
                        onError={(e) => {
                            e.target.src = "/placeholder.png";
                        }}
                    />
                    {/* Ocjena - gornji desni ugao */}
                    <div className="rating-badge">
                        <span className="rating-star">⭐</span>
                        <span className="rating-value">{ocjena}</span>
                    </div>
                </div>

                {/* Informacije */}
                <div className="ad-card-info">
                    <h3 className="ad-card-title">{naziv}</h3>
                    <p className="ad-card-location">
                        📍 {ad.korisnik?.nadimak || "Nepoznat korisnik"}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export default AdCard;
