
import "./registerpage.css";

function RegisterPage() {
  return (
    <div className="background">
      <img src="./SLIKE/background.jpg" alt="background" />
      <img src="./SLIKE/logozad.png" className="logo" alt="logo" />

      <div className="registerblock">
        <div className="register">REGISTRACIJA</div>

        <form action="" method="">
          <input type="text" name="name" className="name" required />
          <input type="text" name="lastname" className="lastname" required />
          <input type="text" name="address" className="address" required />
          <select id="role" name="role" required>
            <option value="" selected disabled></option>
            <option value="oglasivac">Oglasivac</option>
            <option value="kupac">Korisnik</option>
          </select>
        </form>

        <div className="firstname">*Ime</div>
        <div className="secondname">*Prezime</div>
        <div className="adresa">*Adresa</div>
        <div className="uloga">*Odaberi ulogu</div>
        <div className="become">Postani član!</div>
      </div>
    </div>
  );
}

export default RegisterPage;