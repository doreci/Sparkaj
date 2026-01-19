import { useDispatch, useSelector } from "react-redux";
import {
    selectAdsList,
    selectAdsStatus,
    selectAdsError,
    fetchAdsByUserId,
    fetchAllAds,
} from "./adSlice";
import {
    selectUserProfile,
    selectUserStatus,
    selectUserError,
    selectIsAuthenticated,
    fetchUserById,
} from "./userSlice";
import {
    selectSingleAdData,
    selectSingleAdStatus,
    selectSingleAdError,
    fetchAdById,
} from "./singleAdSlice";

// Hooks za oglase
export const useAds = () => {
    const dispatch = useDispatch();
    const list = useSelector(selectAdsList);
    const status = useSelector(selectAdsStatus);
    const error = useSelector(selectAdsError);

    return {
        ads: list,
        status,
        error,
        fetchAllAds: () => dispatch(fetchAllAds()),
        fetchByUserId: (userId) => dispatch(fetchAdsByUserId(userId)),
    };
};

// Hook za jedan oglas
export const useSingleAd = () => {
    const dispatch = useDispatch();
    const data = useSelector(selectSingleAdData);
    const status = useSelector(selectSingleAdStatus);
    const error = useSelector(selectSingleAdError);

    return {
        ad: data,
        status,
        error,
        fetchById: (id) => dispatch(fetchAdById(id)),
    };
};

// Hook za korisnika
export const useUser = () => {
    const dispatch = useDispatch();
    const profile = useSelector(selectUserProfile);
    const status = useSelector(selectUserStatus);
    const error = useSelector(selectUserError);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    return {
        profile,
        status,
        error,
        isAuthenticated,
        fetchById: (userId) => dispatch(fetchUserById(userId)),
    };
};

// Helper za provjeru stanja učitavanja
export const useLoadingState = (status) => {
    return {
        isLoading: status === "loading",
        isIdle: status === "idle",
        isSucceeded: status === "succeeded",
        isFailed: status === "failed",
    };
};
