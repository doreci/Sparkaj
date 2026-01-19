/**
 * Provjerava je li korisnik admin na osnovu email adrese
 * @param {Object} user - Korisnik objekat sa email svojstvom
 * @returns {boolean} true ako je korisnik admin, false inače
 */
export const isAdmin = (user) => {
    if (!user || !user.email) {
        return false;
    }
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    return user.email === adminEmail;
};

/**
 * Vraća ispravnu rutu za profil korisnika (admin ili obični profil)
 * @param {Object} user - Korisnik objekat
 * @returns {string} putanja do profila
 */
export const getProfileRoute = (user) => {
    return isAdmin(user) ? "/admin" : "/profile";
};
