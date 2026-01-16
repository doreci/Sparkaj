import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Dohvati sve oglase
export const fetchAllAds = createAsyncThunk(
    "ads/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/oglasi`);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log("Fetched ads data:", data);
            return Array.isArray(data) ? data : data.data || [];
        } catch (error) {
            return rejectWithValue(error.message || "Neuspješan dohvat oglasa");
        }
    }
);

// Dohvati oglase specifičnog korisnika
export const fetchAdsByUser = createAsyncThunk(
    "ads/fetchByUser",
    async (nickname, { rejectWithValue }) => {
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/korisnik/${encodeURIComponent(
                    nickname
                )}/oglasi`
            );

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            return Array.isArray(data) ? data : data.data || [];
        } catch (error) {
            return rejectWithValue(
                error.message || "Neuspješan dohvat oglasa korisnika"
            );
        }
    }
);

// Pretraži oglase
export const searchAds = createAsyncThunk(
    "ads/search",
    async (filters, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/oglasi/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log("Rezultati pretrage:", data);
            return Array.isArray(data) ? data : data.data || [];
        } catch (error) {
            return rejectWithValue(
                error.message || "Neuspješana pretraga oglasa"
            );
        }
    }
);

const adSlice = createSlice({
    name: "ads",
    initialState: {
        list: [],
        filteredList: [],
        status: "idle",
        error: null,
        currentUser: null,
        isFiltered: false,
    },
    reducers: {
        clearAds(state) {
            state.list = [];
            state.filteredList = [];
            state.status = "idle";
            state.error = null;
            state.currentUser = null;
            state.isFiltered = false;
        },
        setCurrentUser(state, action) {
            state.currentUser = action.payload;
        },
        clearFilters(state) {
            state.filteredList = [];
            state.isFiltered = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchAllAds
            .addCase(fetchAllAds.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchAllAds.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.list = action.payload;
                state.error = null;
                state.isFiltered = false;
                state.filteredList = [];
            })
            .addCase(fetchAllAds.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            // fetchAdsByUser
            .addCase(fetchAdsByUser.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchAdsByUser.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.list = action.payload;
                state.error = null;
                state.isFiltered = false;
                state.filteredList = [];
            })
            .addCase(fetchAdsByUser.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            // searchAds
            .addCase(searchAds.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(searchAds.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.filteredList = action.payload;
                state.isFiltered = true;
                state.error = null;
            })
            .addCase(searchAds.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
                state.isFiltered = false;
            });
    },
});

export const { clearAds, setCurrentUser, clearFilters } = adSlice.actions;

// Selektori
export const selectAdsList = (state) => state.ads.list;
export const selectFilteredAdsList = (state) => state.ads.filteredList;
export const selectIsFiltered = (state) => state.ads.isFiltered;
export const selectAdsStatus = (state) => state.ads.status;
export const selectAdsError = (state) => state.ads.error;
export const selectAdById = (state, id) =>
    state.ads.list.find((ad) => ad.id_oglasa === id);

export default adSlice.reducer;
