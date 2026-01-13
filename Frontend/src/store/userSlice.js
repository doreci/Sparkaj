import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Dohvati korisnika po nadimku
export const fetchUserByNickname = createAsyncThunk(
    "user/fetchByNickname",
    async (nickname, { rejectWithValue }) => {
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/korisnik/${encodeURIComponent(nickname)}`
            );

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            return res.json();
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
            .addCase(fetchUserByNickname.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchUserByNickname.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.profile = action.payload;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(fetchUserByNickname.rejected, (state, action) => {
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
export const selectUserNickname = (state) => state.users.profile?.nadimak;

export default userSlice.reducer;
