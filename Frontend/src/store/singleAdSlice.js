import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Dohvati jedan oglas po ID-u
export const fetchAdById = createAsyncThunk(
    "singleAd/fetchById",
    async (id, { rejectWithValue }) => {
        try {
            if (!id) {
                throw new Error("Nedostaje ID oglasa");
            }

            const res = await fetch(
                `${API_BASE_URL}/api/oglasi/${encodeURIComponent(id)}`
            );

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            return res.json();
        } catch (error) {
            return rejectWithValue(error.message || "Neuspješan dohvat oglasa");
        }
    }
);

const singleAdSlice = createSlice({
    name: "singleAd",
    initialState: {
        data: null,
        status: "idle",
        error: null,
    },
    reducers: {
        clearSingleAd(state) {
            state.data = null;
            state.status = "idle";
            state.error = null;
        },
        setSingleAd(state, action) {
            state.data = action.payload;
            state.status = "succeeded";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdById.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchAdById.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.data = action.payload;
                state.error = null;
            })
            .addCase(fetchAdById.rejected, (state, action) => {
                state.status = "failed";
                state.data = null;
                state.error = action.payload;
            });
    },
});

export const { clearSingleAd, setSingleAd } = singleAdSlice.actions;

// Selektori
export const selectSingleAdData = (state) => state.singleAd.data;
export const selectSingleAdStatus = (state) => state.singleAd.status;
export const selectSingleAdError = (state) => state.singleAd.error;

export default singleAdSlice.reducer;
