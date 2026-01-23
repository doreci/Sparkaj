import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = ''; 

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

// Dohvati oglase specifičnog korisnika po ID-u
export const fetchAdsByUserId = createAsyncThunk(
    "ads/fetchByUserId",
    async (userId, { rejectWithValue }) => {
        try {
            const url = `${API_BASE_URL}/api/korisnik/${userId}/oglasi`;
            console.log("Dohvaćam oglase sa URL-a:", url);
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log("Dohvaćeni oglasi za korisnika:", data);
            return Array.isArray(data) ? data : data.data || [];
        } catch (error) {
            console.error("Greška pri dohvaćanju oglasa:", error);
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
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(filters),
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
            .addCase(fetchAdsByUserId.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchAdsByUserId.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.list = action.payload;
                state.error = null;
                state.isFiltered = false;
                state.filteredList = [];
            })
            .addCase(fetchAdsByUserId.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })

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
