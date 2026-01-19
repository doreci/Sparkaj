import { Link } from "react-router-dom";
import "./adCard.css";

function AdCard({ ad }) {
    if (!ad) return null;

    //console.log("AdCard ad:", ad);
    //console.log("ad.korisnik:", ad.korisnik);
    //console.log("ad.korisnik?.email:", ad.korisnik?.email);

    const ocjena = ad.prosj_ocjena ? ad.prosj_ocjena.toFixed(1) : "N/A";
    const naziv = ad.naziv_oglasa || "Oglas bez naziva";
    const cijena = ad.cijena ? `${ad.cijena.toFixed(2)} €` : "N/A";

    const slika = ad.slika || "/avatar-icon.png";

    return (
        <Link
            to={ad.id_oglasa ? `/ad/${ad.id_oglasa}` : "#"}
            className="ad-card-link"
        >
            <div className="ad-card">
                {/* Slika */}
                <div className="ad-card-image">
                    <img
                        src={slika}
                        alt={naziv}
                        onError={(e) => {
                            e.target.src = "/avatar-icon.png";
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
                        {ad.ulica_broj || "Nepoznata adresa"},{" "}
                        {ad.grad || "Nepoznat grad"}
                    </p>
                    <p className="ad-card-price">
                        <strong>{cijena}</strong>
                    </p>
                </div>
            </div>
        </Link>
    );
}

export default AdCard;
