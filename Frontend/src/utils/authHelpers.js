export const isAdmin = (user) => {
    if (!user || !user.email) {
        return false;
    }
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    return user.email === adminEmail;
};

export const getProfileRoute = (user) => {
    return isAdmin(user) ? "/admin" : "/profile";
};
