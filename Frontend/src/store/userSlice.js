import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Normalizuj podatke korisnika - konvertujem polje 'profilna' u 'slika'
const normalizeUserData = (userData) => {
    if (!userData) return null;
    return {
        ...userData,
        slika: userData.slika || userData.profilna || null,
    };
};

// Dohvati korisnika po UUID-u
export const fetchUserByUUID = createAsyncThunk(
    "user/fetchByUUID",
    async (uuid, { rejectWithValue }) => {
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/korisnik/uuid/${encodeURIComponent(uuid)}`
            );

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            return normalizeUserData(data);
        } catch (error) {
            return rejectWithValue(
                error.message || "Neuspješan dohvat korisnika"
            );
        }
    }
);

// Dohvati korisnika po ID-u
export const fetchUserById = createAsyncThunk(
    "user/fetchById",
    async (id, { rejectWithValue }) => {
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/korisnik/${encodeURIComponent(id)}`
            );

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            return normalizeUserData(data);
        } catch (error) {
            return rejectWithValue(
                error.message || "Neuspješan dohvat korisnika"
            );
        }
    }
);

const userSlice = createSlice({
    name: "user",
    initialState: {
        profile: null,
        status: "idle",
        error: null,
        isAuthenticated: false,
    },
    reducers: {
        clearUser(state) {
            state.profile = null;
            state.status = "idle";
            state.error = null;
            state.isAuthenticated = false;
        },
        setUser(state, action) {
            state.profile = action.payload;
            state.isAuthenticated = true;
            state.status = "succeeded";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Handle fetchUserByUUID
            .addCase(fetchUserByUUID.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchUserByUUID.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.profile = action.payload;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(fetchUserByUUID.rejected, (state, action) => {
                state.status = "failed";
                state.profile = null;
                state.isAuthenticated = false;
                state.error = action.payload;
            })
            // Handle fetchUserById
            .addCase(fetchUserById.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.profile = action.payload;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.status = "failed";
                state.profile = null;
                state.isAuthenticated = false;
                state.error = action.payload;
            });
    },
});

export const { clearUser, setUser } = userSlice.actions;

// Selektori
export const selectUserProfile = (state) => state.users.profile;
export const selectUserStatus = (state) => state.users.status;
export const selectUserError = (state) => state.users.error;
export const selectIsAuthenticated = (state) => state.users.isAuthenticated;
export const selectUserImage = (state) => state.users.profile?.slika;

export default userSlice.reducer;
