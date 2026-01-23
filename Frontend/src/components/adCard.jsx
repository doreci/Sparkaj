import { Link } from "react-router-dom";
import "./adCard.css";

function AdCard({ ad, isOwned = false, onDelete = null }) {
    if (!ad) return null;

    //console.log("AdCard ad:", ad);
    //console.log("ad.korisnik:", ad.korisnik);
    //console.log("ad.korisnik?.email:", ad.korisnik?.email);

    const ocjena = ad.prosj_ocjena ? ad.prosj_ocjena.toFixed(1) : "0";
    const naziv = ad.naziv_oglasa || "Oglas bez naziva";
    const cijena = ad.cijena ? `${ad.cijena.toFixed(2)} €` : "N/A";

    const slika = ad.slika || "/avatar-icon.png";

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (onDelete) {
            if (window.confirm("Jeste li sigurni da želite obrisati ovaj oglas? Ova akcija se ne može vratiti.")) {
                onDelete(ad.id_oglasa);
            }
        }
    };

    const cardContent = (
        <div className="ad-card">
            <div className="ad-card-image">
                <img
                    src={slika}
                    alt={naziv}
                    onError={(e) => {
                        e.target.src = "/avatar-icon.png";
                    }}
                />
                <div className="rating-badge">
                    <span className="rating-star">⭐</span>
                    <span className="rating-value">{ocjena}</span>
                </div>
            </div>

            <div className="ad-card-info">
                <h3 className="ad-card-title">{naziv}</h3>
                <p className="ad-card-location">
                    {ad.ulica_broj || "Nepoznata adresa"},{" "}
                    {ad.grad || "Nepoznat grad"}
                </p>
                <p className="ad-card-price">
                    <strong>{cijena} / h</strong>
                </p>
            </div>

            {isOwned && (
                <div className="ad-card-actions">
                    <Link
                        to={`/edit-ad/${ad.id_oglasa}`}
                        className="btn-edit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        ✏️ Uredi
                    </Link>
                </div>
            )}
        </div>
    );

    // Ako je vlasnik oglasa, ne linkaj na stranicu oglasa
    if (isOwned) {
        return <div className="ad-card-link">{cardContent}</div>;
    }

    return (
        <Link
            to={ad.id_oglasa ? `/ad/${ad.id_oglasa}` : "#"}
            className="ad-card-link"
        >
            {cardContent}
        </Link>
    );
}

export default AdCard;
